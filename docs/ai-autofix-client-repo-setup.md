# Onboarding a client repo to AI auto-fix

Follow these numbered steps **once per client repository**. Everything in
[Prerequisites](#prerequisites) is already set up org-wide and does **not** need
repeating per repo.

Outcome: when that client logs a non-`future`, non-`question` issue in the
portal, Claude opens a pull request against the repo for a human to review.

---

## Prerequisites

These are configured **once for the whole org** and are already done. You only
revisit them if you re-create the GitHub App, rotate keys, or set up a new org —
see [Appendix: global setup](#appendix-global-setup) for the details.

- **GitHub App** `transform-creative-ai-autorun` exists with **Contents, Pull
  requests, Actions, Issues = Read & write** and **no Administration**, and is
  installed on the org.
- **Org Actions secrets** are set and shared to the pipeline repos:
  `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`), `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `AI_BOT_USER_ID`, `GH_APP_ID`,
  `GH_APP_PRIVATE_KEY`.
- **Org Actions policy** allows the third-party actions the workflow uses
  (`anthropics/claude-code-action`, `actions/create-github-app-token`).
- **AI bot auth user** exists in Supabase (`AI_BOT_USER_ID`) — author of the
  "needs more info" questions.
- **Supabase side**: `dispatch-issue` edge function deployed, and the `issues`
  INSERT Database Webhook/trigger is wired.
- **GitHub Team plan** (enables branch protection on private repos).
- **Central reusable workflow** lives in one org repo (`transformcreative/ci`) at
  `.github/workflows/ai-autofix.yml` (the `workflow_call` version — canonical
  source kept in this repo). Its Actions access is set to **"Accessible from
  repositories owned by the organization."** Editing it updates every client; the
  per-repo stub only forwards to it.

---

## Per-repo steps

### 1. Grant the App access to the repo

App install settings (org **Settings → GitHub Apps → transform-creative-ai-autorun
→ Configure**) → **Repository access → Only select repositories** → add the repo,
Save. No installation ID to record — the edge function looks it up per repo.

### 2. Add the stub workflow

Copy the stub
[`.github/templates/ai-autofix-stub.yml`](../.github/templates/ai-autofix-stub.yml)
into the **client repo** as `.github/workflows/ai-autofix.yml`, commit, and push
to the **default branch** (`workflow_dispatch` only fires from there). The stub
holds no logic — it just forwards to the central reusable workflow
(`transformcreative/ci/.github/workflows/ai-autofix.yml@v1`), so you never copy
the full workflow per repo and future logic changes propagate automatically.

> Only edit the `uses:` ref if your central repo isn't `transformcreative/ci`.
> The `anthropics/claude-code-action` SHA pin lives in the central workflow now,
> not here.

### 3. Grant the org secrets to the repo

The secrets already exist at org level (see Prerequisites). Just add this repo to
each secret's **selected repositories** list (Org **Settings → Secrets and
variables → Actions**). If the repo isn't in the org, add them as repo secrets
instead — see the [Appendix](#appendix-global-setup) for values.

### 4. Protect `main` (the safety net)

Repo **Settings → Branches → Add branch ruleset** (or classic **Add rule**) for
`main`:
- ✅ Require a pull request before merging — **Require approvals: 1**
- ✅ Block force pushes
- ✅ Restrict deletions
- Do **not** add the GitHub App to any bypass list.

This is what guarantees the agent can only ever *propose* a change; a human
merges. Without it the whole security model is moot — don't skip it.

### 5. Point the business at the repo

In Supabase (SQL editor or Table editor), on the `businesses` row for this client:

```sql
update businesses
set github_repo = 'owner/repo',        -- e.g. 'transformcreative/acme-site'
    github_default_branch = 'main',    -- only change if their default isn't main
    ai_autofix_enabled = true
where id = <business_id>;
```

### 6. Smoke test

1. As that client (or admin, logged for that client), log a simple **bug** in the
   portal — give it a clear, small, real description.
2. Within seconds the issue card should show **AI queued**, then **AI working**.
3. The repo's **Actions** tab shows an **AI auto-fix** run.
4. On success the card shows **PR ready** with a **View pull request** link;
   open it and confirm it targets a protected `main` and can't self-merge.
5. Vague issue → expect **Needs info** and a question in the comments panel
   instead of a PR.

If it stalls, check `ai_status` / `ai_error` on the issue row and the
**dispatch-issue** edge function logs.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `installation lookup 404` | App not installed on the repo's org/account | install/grant the App on the repo (step 1) |
| `ai_status` stays `null` | webhook didn't reach the function | check the Database Webhook exists on `issues` INSERT and the `x-webhook-secret` header matches |
| `ai_status = 'skipped'` | a gate caught it | `ai_error` says which: business not enabled, no `github_repo`, or type=question |
| `ai_status = 'failed'`, error `dispatch 404` | wrong `github_repo`, or App not installed on it | fix `github_repo`; install the App on the repo |
| `dispatch 403` | App missing Actions permission, or stub not on default branch yet | confirm App perms; push the stub `ai-autofix.yml` to the default branch first |
| Run fails immediately: `workflow was not found` / `not allowed to access` | central reusable workflow not reachable | in `transformcreative/ci` → Settings → Actions → General, set access to **"Accessible from repositories owned by the organization"**; check the stub's `uses:` ref + `@v1` tag exist |
| Run starts but no PR, status `failed` | Claude couldn't finish / no result file, or missing secret | open the Actions run logs; usually a missing secret not granted to the repo (step 3) |
| PR opened but `ai_status` never updates | report-back step failed | check `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` secrets reach the repo |
| Questions don't appear in portal | `AI_BOT_USER_ID` unset/invalid | set it to a real auth user's UUID |

---

## Appendix: global setup

Only needed when re-creating the App, rotating keys, or setting up a new org.

### Org Actions secrets

Set these **once at the org level** (Org **Settings → Secrets and variables →
Actions → New organization secret**) and grant them to the pipeline repos. If a
repo isn't in an org, add them as **repo** secrets instead.

| Secret | Value | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` *or* `CLAUDE_CODE_OAUTH_TOKEN` | Claude credential | API key from the Anthropic console; or `claude setup-token` for a subscription |
| `SUPABASE_URL` | `https://hzfjmmakqwsmucxorhlb.supabase.co` | fixed |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | Supabase Dashboard → **Settings → API** → `service_role` |
| `AI_BOT_USER_ID` | 208491f6-85be-4ab8-92ae-c92b2ddcc38c (the AI bot's auth user id) | created once — see below |
| `GH_APP_ID` | the GitHub App's numeric App ID | App settings → **General → App ID** |
| `GH_APP_PRIVATE_KEY` | the GitHub App private key (PEM) | App settings → **General → Private keys → Generate a private key** |

> `SUPABASE_SERVICE_ROLE_KEY` is powerful — keep it an org secret scoped only to
> repos that use this pipeline.

### Create the AI bot user

Supabase Dashboard → **Authentication → Users → Add user** (e.g.
`ai-bot@transformcreative.com.au`), then copy its **UUID** — that's
`AI_BOT_USER_ID`. It's the author of the "needs more info" questions Claude posts
back to the portal.

### `GH_APP_ID` + `GH_APP_PRIVATE_KEY` — why and how

The workflow opens its PR with a token minted from the GitHub App (via
`actions/create-github-app-token`) rather than the default `GITHUB_TOKEN`. This
sidesteps the org setting *"Allow GitHub Actions to create and approve pull
requests"* (which blocks the default token) **without** granting that power
org-wide, and attributes the PR to the App.

- **App ID:** GitHub → **Settings → Developer settings → GitHub Apps → your app →
  General → App ID** (a number; same value as Supabase's `GITHUB_APP_ID`).
- **Private key:** same General page → **Private keys → Generate a private key** →
  a `.pem` downloads. Paste its **full contents** (including the `-----BEGIN…-----`
  / `-----END…-----` lines) as the secret. Use the key **as downloaded** — no
  PKCS8 conversion needed here (that was only for the Supabase edge function's Web
  Crypto). Delete the `.pem` after pasting.

> **Never paste a private key into chat, a ticket, or a committed file.** If one is
> exposed, rotate it: App settings → **Private keys** → delete it and generate a
> new one. An App can hold several keys, so rotating one won't break the others
> (e.g. the Supabase edge function's key stays valid).

---

## Quick reference — what's global vs per-repo

| Set up **once** (Prerequisites / Appendix) | Per repo |
|---|---|
| GitHub App + key, edge function, DB trigger | Grant App access to the repo |
| Org secrets (Claude/Supabase/bot id) | Add the stub `ai-autofix.yml` (commit to default branch) |
| Org Actions policy, AI bot auth user | Grant org secrets to the repo |
| Central reusable workflow + its Actions access | Protect `main` |
| GitHub Team plan | Set `github_repo` + `ai_autofix_enabled` |
