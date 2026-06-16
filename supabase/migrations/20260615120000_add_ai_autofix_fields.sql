-- AI auto-fix schema additions. Already applied to the live project via the
-- Supabase MCP migration `add_ai_autofix_fields`; kept here for repo parity.
-- Idempotent (IF NOT EXISTS), so safe to re-run.

-- Repo mapping + opt-in on businesses
alter table public.businesses
  add column if not exists github_repo text,
  add column if not exists github_default_branch text not null default 'main',
  add column if not exists ai_autofix_enabled boolean not null default false;

-- Prompt-relevance fields on issues (captured in the modal)
alter table public.issues
  add column if not exists issue_type text,
  add column if not exists more_info text;

-- AI pipeline state on issues (written by the workflow / edge function)
alter table public.issues
  add column if not exists ai_status text,
  add column if not exists ai_branch text,
  add column if not exists ai_pr_url text,
  add column if not exists ai_pr_number integer,
  add column if not exists ai_run_id text,
  add column if not exists ai_attempts integer not null default 0,
  add column if not exists ai_error text,
  add column if not exists ai_updated_at timestamptz;

alter table public.issues drop constraint if exists issues_issue_type_check;
alter table public.issues add constraint issues_issue_type_check
  check (issue_type is null or issue_type in ('bug', 'issue', 'question'));

alter table public.issues drop constraint if exists issues_ai_status_check;
alter table public.issues add constraint issues_ai_status_check
  check (ai_status is null or ai_status in (
    'queued', 'processing', 'pr_open', 'needs_info', 'failed', 'skipped'
  ));
