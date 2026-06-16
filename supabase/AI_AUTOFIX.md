# AI Auto-Fix Pipeline — setup & operations

When a client logs an issue (not `future`, not a `question`), an AI agent reads
the business's GitHub repo, makes the change on a new branch, writes/updates
tests, and opens a PR for a human to review and merge.

**Flow:** `issues` INSERT → Postgres trigger → `dispatch-issue` edge function
(fast, <1s) → GitHub Actions (`ai-autofix.yml`) runs Claude → PR opened → status
written back to the issue → portal shows the PR link (or Claude's questions).

The edge function only *dispatches* — the multi-minute agent runs in GitHub
Actions, so Supabase edge time is never spent waiting on Claude.

---

## One-time setup

### 1. Database (already applied to the live project)
Columns added by migration `add_ai_autofix_fields`
(`supabase/migrations/20260615120000_add_ai_autofix_fields.sql`): `businesses`
gets `github_repo`, `github_default_branch`, `ai_autofix_enabled`; `issues` gets
`issue_type`, `more_info`, and the `ai_*` state columns.

### 2. GitHub App (the security boundary)
Create one GitHub App and install it on each client repo with **only**:
`Contents: Read & write`, `Pull requests: Read & write`,
`Actions: Read & write`, `Issues: Read & write`.
**No `Administration`** and do **not** add it to any branch-protection bypass
list — that's what makes it impossible for the agent to push to or unprotect
`main`. Note the App id and download its private key (convert to PKCS8:
`openssl pkcs8 -topk8 -nocrypt -in key.pem -out key.pkcs8.pem`).

### 3. Edge function secrets
```bash
supabase link --project-ref hzfjmmakqwsmucxorhlb
supabase secrets set \
  DISPATCH_WEBHOOK_SECRET="$(openssl rand -hex 32)" \
  GITHUB_APP_ID="<app id>" \
  GITHUB_APP_PRIVATE_KEY="$(cat key.pkcs8.pem)"
supabase functions deploy dispatch-issue
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.)

### 4. Wire the trigger
Either apply `supabase/migrations/20260616000000_dispatch_issue_trigger.sql`
(replace the secret placeholder first), **or** create a Database Webhook in the
dashboard (Database → Webhooks) on `issues` INSERT pointing at the function URL
with an `x-webhook-secret` header equal to `DISPATCH_WEBHOOK_SECRET`.

### 5. Per client repo
- Copy `.github/workflows/ai-autofix.yml` into the repo and **pin the action to
  a commit SHA**.
- Add repo/org secrets: `ANTHROPIC_API_KEY` **or** `CLAUDE_CODE_OAUTH_TOKEN`
  (cost note below), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `AI_BOT_USER_ID` (an `auth.users` id used as the author of needs-info
  comments — create a dedicated "AI" auth user and use its id).
- **Protect `main`:** require a PR + at least one approving review; restrict
  direct pushes; do not allow the App to bypass.
- Set `businesses.github_repo = 'owner/repo'` and `ai_autofix_enabled = true`.

---

## Cost & Claude auth
Model tokens are billed per-token via the Anthropic API (~$0.30–$5 per issue on
Opus 4.8) regardless of where the loop runs; GitHub Actions compute is free at
this volume. The Claude **Pro** subscription does **not** cover automated runs.
The workflow accepts either credential — `ANTHROPIC_API_KEY` (pay-as-you-go,
recommended for unattended use) or `CLAUDE_CODE_OAUTH_TOKEN` (`claude
setup-token`, best on **Max**; Pro's interactive limits throttle unattended
runs). `--max-turns` in the workflow bounds per-issue spend.

---

## Verification
1. **Dispatch (fast):** `supabase functions serve dispatch-issue`, POST a sample
   webhook body with the `x-webhook-secret` header → returns <1s, sets
   `ai_status='queued'`, fires a `workflow_dispatch`. Confirm `severity=future`,
   `issue_type=question`, and `ai_autofix_enabled=false` all short-circuit.
2. **Happy path:** seed a bug in a test repo, trigger the workflow → Claude opens
   a branch + PR (with tests + verification steps); the final step PATCHes the
   issue to `pr_open` with the PR url. Confirm the PR targets a protected `main`
   and cannot self-merge.
3. **Needs-info:** log a vague issue → Claude posts questions as a comment and
   sets `ai_status='needs_info'` (no PR).
4. **Serialization:** log two issues for the same repo quickly → runs queue (one
   at a time per repo).
5. **Security:** confirm the App has no `Administration` permission and isn't in
   the bypass list; the workflow `permissions:` block lists only
   `contents`/`pull-requests`/`issues: write`.
6. **UI:** the issue card shows the AI status chip and a "View pull request" link
   when present; needs-info questions appear in the comments panel.
