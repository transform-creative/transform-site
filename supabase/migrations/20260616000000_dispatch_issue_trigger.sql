-- AI auto-fix: fire the `dispatch-issue` edge function on new issues.
--
-- ⚠️ APPLY THIS ONLY AFTER the dispatch-issue function is deployed AND its
-- secrets are set (see supabase/AI_AUTOFIX.md). Until then the call just fails
-- silently (the INSERT still succeeds — pg_net is async), so nothing breaks,
-- but there's no point wiring it before the function exists.
--
-- Prefer the Dashboard Database Webhook (Database → Webhooks) for a managed
-- setup; this SQL trigger is the infrastructure-as-code equivalent. Replace the
-- two placeholders below before applying.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_dispatch_issue()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url     := 'https://hzfjmmakqwsmucxorhlb.functions.supabase.co/dispatch-issue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<<DISPATCH_WEBHOOK_SECRET>>'  -- must match the function's secret
    ),
    body    := jsonb_build_object(
      'type', 'INSERT',
      'table', 'issues',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_dispatch_issue on public.issues;
create trigger trg_dispatch_issue
  after insert on public.issues
  for each row
  execute function public.notify_dispatch_issue();
