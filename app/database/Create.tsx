/*************************************************************************
 * INSERT operations against the Supabase database.
 *
 * Follows the idiom used in Read.tsx: import { supabase } from
 * "./SupabaseClient", import { logError } from "./Auth", and `throw`
 * on error after logging.
 */

import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";
import type {
  Article,
  ArticleInsert,
  Issue,
  IssueComment,
  OrgDecision,
} from "~/data/CustomTypes";
import {
  ARTICLE_IMAGE_BUCKET,
  ARTICLE_IMAGE_FOLDER,
} from "~/business/blogBL";
import type { Tables, TablesInsert } from "./supabase";

/*************************
 * Create a new issue (the "Log issue" button). The caller supplies at least
 * `client_id`; `business_id`, `title`, `description` and `severity` are set
 * from the form.
 */
export async function createIssue(
  issue: TablesInsert<"issues">
): Promise<Issue> {
  const { data, error } = await supabase
    .from("issues")
    .insert(issue)
    .select()
    .single();

  if (error) {
    await logError(error, ["createIssue", "Create"]);
    throw error;
  }

  return data;
}

/*************************
 * Add a comment to an issue (the per-card comments composer).
 */
export async function createIssueComment(
  comment: TablesInsert<"issue_comments">
): Promise<IssueComment> {
  const { data, error } = await supabase
    .from("issue_comments")
    .insert(comment)
    .select()
    .single();

  if (error) {
    await logError(error, ["createIssueComment", "Create"]);
    throw error;
  }

  return data;
}

/*************************
 * Store a public form submission. All form fields live in the `metadata` jsonb
 * column; the caller sets `business_id` so the owning business can read it.
 */
export async function createResponse(
  response: TablesInsert<"responses">
): Promise<boolean> {
  const { data, error } = await supabase
    .from("responses")
    .insert(response);

  if (error) {
    await logError(error, ["createResponse", "Create"]);
    throw error;
  }

  return true;
}

/*************************
 * Create a blog post (draft or published) from the admin Blog tab.
 * A duplicate slug fails with Postgres code 23505.
 */
export async function createArticle(article: ArticleInsert): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .insert(article)
    .select()
    .single();

  if (error) {
    await logError(error, ["createArticle", "Create"]);
    throw error;
  }

  return data;
}

/*************************
 * Upload a blog image (cover or inline) to the public `transform` bucket under
 * articles/ and return its public URL. RLS limits uploads to agency admins.
 */
export async function uploadArticleImage(file: File): Promise<string> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${ARTICLE_IMAGE_FOLDER}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(ARTICLE_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "31536000", contentType: file.type });

  if (error) {
    await logError(error, ["uploadArticleImage", "Create"]);
    throw error;
  }

  return supabase.storage.from(ARTICLE_IMAGE_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

/*************************
 * Record radar triage decisions (one org from the Decide menu, or the
 * Notion picks as Pursuing). Append-only: the newest row per ABN wins.
 */
export async function createOrgDecisions(
  decisions: TablesInsert<"org_decisions">[]
): Promise<OrgDecision[]> {
  const { data, error } = await supabase
    .from("org_decisions")
    .insert(decisions)
    .select();

  if (error) {
    await logError(error, ["createOrgDecisions", "Create"]);
    throw error;
  }

  return data;
}
