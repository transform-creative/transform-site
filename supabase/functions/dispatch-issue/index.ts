// dispatch-issue — fast dispatcher for the AI auto-fix pipeline.
//
// Triggered by a Supabase Database Webhook on `issues` INSERT. It does NOT call
// Claude (that runs for minutes in GitHub Actions). It only: validates, gates,
// mints a short-lived GitHub App token, fires a workflow_dispatch on the
// reporting client's repo, and marks the issue `queued`. Designed to return in
// <1s.
//
// Required secrets (supabase secrets set ...):
//   DISPATCH_WEBHOOK_SECRET   shared header the Database Webhook must send
//   GITHUB_APP_ID             the GitHub App's numeric id
//   GITHUB_APP_PRIVATE_KEY    the App private key, PKCS8 PEM ("BEGIN PRIVATE KEY")
//   WORKFLOW_FILE             optional, defaults to "ai-autofix.yml"
// Provided automatically by the platform: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GITHUB_API = "https://api.github.com";
const GH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "transform-dispatch-issue",
};

/** The repo-routing fields we read off a client's owned business. */
interface BusinessRepo {
  github_repo: string | null;
  github_default_branch: string | null;
  ai_autofix_enabled: boolean | null;
}

/** A Supabase Database Webhook payload for an INSERT on `issues`. */
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: number;
    client_id: string | null;
    business_id: number | null;
    severity: string | null;
    issue_type: string | null;
    title: string | null;
    description: string | null;
    more_info: string | null;
    ai_status: string | null;
  } | null;
}

Deno.serve(async (req) => {
  // 1. Authenticate the webhook with a shared secret.
  const secret = Deno.env.get("DISPATCH_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad payload" }, 400);
  }

  const issue = payload.record;
  if (payload.type !== "INSERT" || payload.table !== "issues" || !issue) {
    return json({ skipped: "not an issue insert" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 2. Cheap gates — never spend a GitHub run on these.
  // An admin can opt the issue out of the AI up-front: the modal inserts the row
  // already marked `skipped`, so honour that without overwriting the reason.
  if (issue.ai_status === "skipped") return json({ skipped: "skipped by admin" });
  if (issue.severity === "future") return await skip(supabase, issue.id, "severity future");
  if (issue.issue_type === "question") return await skip(supabase, issue.id, "type question");

  const hasContent = (issue.description ?? "").trim() || (issue.more_info ?? "").trim();
  if (!hasContent) {
    await setStatus(supabase, issue.id, { ai_status: "needs_info", ai_error: "No description provided" });
    return json({ skipped: "empty issue → needs_info" });
  }

  // 3. Resolve the target repo from the CLIENT's own business.
  //    `issue.business_id` is the agency the request was lodged to (e.g. the
  //    Transform Creative board) — it is NOT where the client's code lives.
  //    The repo to work in belongs to the client who reported the issue: the
  //    business they own, linked by `businesses.user_id = issue.client_id`.
  if (!issue.client_id) return await skip(supabase, issue.id, "no client");
  const { data: ownedBusinesses } = await supabase
    .from("businesses")
    .select("github_repo, github_default_branch, ai_autofix_enabled")
    .eq("user_id", issue.client_id);

  // A client could own more than one business; prefer one that's actually wired
  // up for auto-fix (enabled + has a repo) over an arbitrary first row.
  const owned: BusinessRepo[] = ownedBusinesses ?? [];
  const business =
    owned.find((b) => b.ai_autofix_enabled && b.github_repo) ?? owned[0];

  if (!business?.ai_autofix_enabled || !business.github_repo) {
    return await skip(supabase, issue.id, "auto-fix disabled or no repo");
  }
  const repo = business.github_repo; // "owner/repo"
  const branch = business.github_default_branch || "main";

  // 4 + 5. Mint a GitHub App token scoped to the repo, then fire the workflow.
  try {
    const token = await repoInstallationToken(repo);
    const workflow = Deno.env.get("WORKFLOW_FILE") ?? "ai-autofix.yml";
    const resp = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ref: branch,
          inputs: {
            issue_id: String(issue.id),
            title: (issue.title ?? "").slice(0, 200),
            issue_type: issue.issue_type ?? "issue",
            severity: issue.severity ?? "",
          },
        }),
      },
    );
    if (!resp.ok) {
      const detail = await resp.text();
      await setStatus(supabase, issue.id, {
        ai_status: "failed",
        ai_error: `dispatch ${resp.status}: ${detail.slice(0, 300)}`,
      });
      return json({ error: "dispatch failed", status: resp.status, detail }, 502);
    }
  } catch (e) {
    await setStatus(supabase, issue.id, { ai_status: "failed", ai_error: String(e).slice(0, 300) });
    return json({ error: "dispatch error", detail: String(e) }, 500);
  }

  // 6. Mark queued (one attempt counted).
  await supabase
    .from("issues")
    .update({ ai_status: "queued", ai_error: null, ai_updated_at: new Date().toISOString() })
    .eq("id", issue.id);
  await bumpAttempts(supabase, issue.id);

  return json({ ok: true, issue: issue.id, repo });
});

/* ----------------------------- helpers ----------------------------- */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
async function skip(supabase: any, id: number, reason: string): Promise<Response> {
  await setStatus(supabase, id, { ai_status: "skipped", ai_error: reason });
  return json({ skipped: reason });
}

// deno-lint-ignore no-explicit-any
async function setStatus(supabase: any, id: number, patch: Record<string, unknown>) {
  await supabase
    .from("issues")
    .update({ ...patch, ai_updated_at: new Date().toISOString() })
    .eq("id", id);
}

// deno-lint-ignore no-explicit-any
async function bumpAttempts(supabase: any, id: number) {
  const { data } = await supabase.from("issues").select("ai_attempts").eq("id", id).single();
  await supabase
    .from("issues")
    .update({ ai_attempts: (data?.ai_attempts ?? 0) + 1 })
    .eq("id", id);
}

/** Mint an installation token scoped to a single repo (actions:write only). */
async function repoInstallationToken(repo: string): Promise<string> {
  const jwt = await appJwt();
  const inst = await fetch(`${GITHUB_API}/repos/${repo}/installation`, {
    headers: { ...GH_HEADERS, Authorization: `Bearer ${jwt}` },
  });
  if (!inst.ok) throw new Error(`installation lookup ${inst.status}: ${await inst.text()}`);
  const { id } = await inst.json();

  const repoName = repo.split("/")[1];
  const tok = await fetch(`${GITHUB_API}/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: { ...GH_HEADERS, Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ repositories: [repoName], permissions: { actions: "write" } }),
  });
  if (!tok.ok) throw new Error(`token mint ${tok.status}: ${await tok.text()}`);
  return (await tok.json()).token;
}

/** Build and RS256-sign a short-lived GitHub App JWT (10-min max, 9 used). */
async function appJwt(): Promise<string> {
  const appId = Deno.env.get("GITHUB_APP_ID");
  const pem = Deno.env.get("GITHUB_APP_PRIVATE_KEY");
  if (!appId || !pem) throw new Error("GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY not set");

  const now = Math.floor(Date.now() / 1000);
  const header = b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64urlStr(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const data = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(data),
  );
  return `${data}.${b64urlBytes(new Uint8Array(sig))}`;
}

function b64urlStr(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlBytes(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return b64urlStr(s);
}
function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
