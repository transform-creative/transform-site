import { supabase } from "./SupabaseClient";

/*************************
 * Sign user in with otp
 * @param email Email address to try sign in
 */
export async function supabaseSignIn(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) throw error;

  return data;
}

/***************************
 * Sign out the session
 */
export async function supabaseSignOut() {
  const { error } = await supabase.auth.signOut();

  if (error) return error;

  return true;
}

/*************************
 * Verify the OTP code emailed to the user.
 */
export async function SignInWithOtp(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: otp,
    type: "email",
  });

  if (error) throw error;

  return data;
}


/***********************
 * Handle error logging
 * @param error The error object
 * @param fn The function name
 */
export async function logError(error: any, stack?: string[]) {
  console.error(error, "at", stack);
}

/****************************
 * Insert logs into the database, via the rate-limited `insert-logs` edge
 * function (clients can't write `audit_logs` directly).
 * @param event_type An event message or brief description
 * @param severity
 * @param metadata Any object
 */
export async function insertLog(
  event_type: string,
  severity: "info" | "warning" | "error" | "critical",
  metadata: Object,
) {
  //Enrich metadata with the current user id and page url
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const enrichedMetadata = {
    ...metadata,
    user_id: session?.user?.id ?? null,
    url: typeof window !== "undefined" ? window.location.href : null,
  };

  //Log locally in dev
  if (import.meta.env.DEV) {
    console.info(severity, event_type, enrichedMetadata);
    return;
  }

  const { error } = await supabase.functions.invoke("insert-logs", {
    body: {
      event_type,
      severity,
      metadata: enrichedMetadata,
    },
  });

  // Never throw from the logger, but don't swallow it silently either: the
  // edge function rate-limits to 20 logs per minute per IP.
  if (error) {
    console.warn("Failed to write log", event_type, error);
  }
}
