// insert-logs — the only way clients write to `audit_logs`. Validates the
// payload, rate-limits per IP (20 a minute, via Upstash) and inserts with the
// service role. Ported from the Ping Pong-A-Thon function of the same name.
//
// Required secrets (`supabase secrets set ...`):
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Provided automatically by the platform: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.21.4";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.3";

// Admin client (service role) — bypasses RLS
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "",
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(20, "60 s"),
  analytics: false,
});

// Strict schema so clients can't send garbage. We don't trust the client to
// send the user_id or timestamp — those are set here.
const logSchema = z.object({
  event_type: z.string().max(500),
  severity: z.enum(["info", "warning", "error", "critical"]),
  metadata: z.any().optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Give up on a slow insert rather than hold the request open.
  const REQUEST_TIMEOUT_MS = 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    // x-forwarded-for is a chain ("client, proxy1, proxy2") whose proxy hops
    // rotate between requests. Take only the leftmost (real client) IP so the
    // rate-limit key stays stable across a session.
    const ip = (req.headers.get("x-forwarded-for") ?? "anon_ip")
      .split(",")[0]
      .trim();
    const { success } = await ratelimit.limit(`log_${ip}`);

    if (!success) {
      return new Response(null, { status: 429, headers: corsHeaders });
    }

    const body = await req.json();
    const result = logSchema.safeParse(body);

    if (!result.success) {
      console.error(result.error, body);
      return new Response("Invalid Log Format", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { event_type, severity, metadata } = result.data;

    // Rebuild the row rather than inserting the payload as-is.
    const { error } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        event_type,
        severity,
        metadata: metadata || {},
        ip_address: ip,
        user_id: null,
        timestamp: new Date().toISOString(),
      })
      .abortSignal(controller.signal);

    if (error) throw error;

    return new Response("Logged", { status: 200, headers: corsHeaders });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error("Database insert timed out.");
      return new Response("Timeout", { status: 504, headers: corsHeaders });
    }

    console.error(err);
    // Never hand the real error back to the client.
    return new Response("Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
});
