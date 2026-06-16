# Onboarding a client repo to AI auto-fix

Follow this once per client repository. It assumes the **global setup is already
done** (the GitHub App exists, the `dispatch-issue` edge function is deployed,
and the `issues` trigger/webhook is wired — see
[`supabase/AI_AUTOFIX.md`](../supabase/AI_AUTOFIX.md)).

Outcome: when that client logs a non-`future`, non-`question` issue in the
portal, Claude opens a pull request against the repo for a human to review.

---

## Checklist (tick as you go)

- [ ] 1. Install the GitHub App on the repo
- [ ] 2. Add the `ai-autofix.yml` workflow to the repo
- [ ] 3. Add the secrets (org-level once, or per-repo)
- [ ] 4. Protect the `main` branch
- [ ] 5. Point the business at the repo (`github_repo` + `ai_autofix_enabled`)
- [ ] 6. Smoke-test with a throwaway issue

---

## 1. Install the GitHub App on the repo

1. Go to the App's install settings:
   `https://github.com/settings/installations` (or the org's
   **Settings → GitHub Apps**), find **transform-ai-autofix**, click
   **Configure**.
2. Under **Repository access** → **Only select repositories**, add the new
   client repo. Save.

No installation ID to record — the edge function looks it up per repo.

> The App must have **Contents**, **Pull requests**, **Actions**, **Issues** =
> Read & write, and **NOT** Administration. That's set on the App itself, so it's
> already correct for every repo.

## 2. Add the workflow

Copy [`.github/workflows/ai-autofix.yml`](../.github/workflows/ai-autofix.yml)
from this repo into the **client repo** at the same path, commit, and push to
`main`.

> **Pin the action.** Change `anthropics/claude-code-action@v1` to a specific
> commit SHA (find the latest release commit on the action's repo). Do this once,
> then reuse the same pinned line for every client.

## 3. Add the secrets

These are identical for every client, so set them **once at the GitHub org level**
(Org **Settings → Secrets and variables → Actions → New organization secret**)
and grant them to selected repos — then step 3 is a no-op for future repos.
If the repo isn't in an org, add them as **repo** secrets
(Repo **Settings → Secrets and variables → Actions**).

| Secret | Value | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` *or* `CLAUDE_CODE_OAUTH_TOKEN` | Claude credential | API key from the Anthropic console; or `claude setup-token` for a subscription |
| `SUPABASE_URL` | `https://hzfjmmakqwsmucxorhlb.supabase.co` | fixed |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | Supabase Dashboard → **Settings → API** → `service_role` |
| `AI_BOT_USER_ID` | the AI bot's auth user id | created once — see below |

**Create the AI bot user once (reused for all repos):** Supabase Dashboard →
**Authentication → Users → Add user** (e.g. `ai-bot@transformcreative.com.au`),
then copy its **UUID** — that's `AI_BOT_USER_ID`. It's the author of the
"needs more info" questions Claude posts back to the portal.

> `SUPABASE_SERVICE_ROLE_KEY` is powerful — keep it an org secret scoped only to
> repos that use this pipeline.

## 4. Protect `main` (the safety net)

Repo **Settings → Branches → Add branch ruleset** (or classic **Add rule**) for
`main`:
- ✅ Require a pull request before merging — **Require approvals: 1**
- ✅ Block force pushes
- ✅ Restrict deletions
- Do **not** add the GitHub App to any bypass list.

This is what guarantees the agent can only ever *propose* a change; a human
merges. Without it, the whole security model is moot — don't skip it.

## 5. Point the business at the repo

In Supabase (SQL editor or Table editor), on the `businesses` row for this
client:

```sql
update businesses
set github_repo = 'owner/repo',        -- e.g. 'transformcreative/acme-site'
    github_default_branch = 'main',    -- only change if their default isn't main
    ai_autofix_enabled = true
where id = <business_id>;
```

## 6. Smoke test

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
| `ai_status` stays `null` | webhook didn't reach the function | check the Database Webhook exists on `issues` INSERT and the `x-webhook-secret` header matches |
| `ai_status = 'skipped'` | a gate caught it | `ai_error` says which: business not enabled, no `github_repo`, or type=question |
| `ai_status = 'failed'`, error `dispatch 404` | wrong `github_repo`, or App not installed on it | fix `github_repo`; install the App on the repo |
| `dispatch 403` | App missing Actions permission, or workflow not on `main` yet | confirm App perms; push `ai-autofix.yml` to `main` first |
| Run starts but no PR, status `failed` | Claude couldn't finish / no result file | open the Actions run logs; usually a missing Claude credential secret |
| PR opened but `ai_status` never updates | report-back step failed | check `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` secrets in the repo |
| Questions don't appear in portal | `AI_BOT_USER_ID` unset/invalid | set it to a real auth user's UUID |

---

## Quick reference — what's global vs per-repo

| Set up **once** (all clients share) | Set up **per repo** |
|---|---|
| GitHub App + key, edge function, DB trigger | Install App on the repo |
| Org secrets (Claude/Supabase/bot id) | Add `ai-autofix.yml` (commit to `main`) |
| AI bot auth user | Protect `main` |
| | Set `github_repo` + `ai_autofix_enabled` |
