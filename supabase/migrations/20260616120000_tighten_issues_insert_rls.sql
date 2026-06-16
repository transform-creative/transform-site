-- Tighten the issues INSERT RLS policy.
--
-- The previous WITH CHECK was:
--   (client_id = auth.uid()) OR client_belongs_to_business(client_id, business_id)
-- Both branches were exploitable:
--   * Branch 1 only tied client_id to the actor, leaving business_id unconstrained
--     — a user could file an issue against ANY business_id (which the AI pipeline
--     maps to a github_repo), enabling cross-tenant targeting + prompt injection.
--   * Branch 2 never referenced auth.uid(), so any authenticated user could forge
--     an issue for any valid (client, business) pair.
--
-- New check mirrors the existing UPDATE policy: a client may only insert their own
-- issue into a business they actually belong to, or a business owner/admin may insert.
-- Already applied to the live project via the Supabase MCP migration
-- `tighten_issues_insert_rls`; kept here for repo parity.

alter policy issues_insert_client_own_only on public.issues
  with check (
    ((client_id = (select auth.uid())) and client_belongs_to_business(client_id, business_id))
    or current_user_owns_business(business_id)
  );
