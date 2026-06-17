// email-handler — drains the `general_email_queue` pgmq queue, renders each
// message into a Transform Creative branded email, and ships it via Maileroo.
//
// Invocation: a Postgres cron schedule (`pg_cron` + `pg_net`, every 1–2 min)
// POSTs to this function. The function reads up to N messages off the queue,
// processes them, and archives each one as it succeeds. Messages that throw
// stay on the queue and surface again on the next tick (pgmq visibility-timeout
// retry semantics).
//
// Required secrets (`supabase secrets set ...`):
//   MAILEROO_SENDING_KEY      Maileroo HTTP API key
// Provided automatically by the platform: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "./generateEmailBody.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
);

const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!,
);

const queueName = "general_email_queue";

/****************************************
 * Process a single message: hand it to the dispatcher, then archive it from
 * the queue on success so it isn't re-delivered.
 */
async function processMessage(message: any) {
  const data = message.message;

  const { data: result, error } = await sendEmail(data);
  if (error != null) {
    throw error;
  }

  const { error: deleteError } = await supabase
    .schema("pgmq_public")
    .rpc("archive", {
      queue_name: queueName,
      message_id: message.msg_id,
    });

  if (deleteError) {
    console.error(
      `Failed to archive message ${message.msg_id}:`,
      deleteError,
    );
  } else {
    console.info(
      `Message ${message.msg_id} archived from queue`,
    );
  }
}

/****************************************
 * The main function body. Reads a small batch of messages off the queue and
 * processes them sequentially — keeps Maileroo rate-limit friendly without
 * needing extra plumbing.
 */
Deno.serve(async (_req) => {
  const errors: any[] = [];

  const { data: messages, error } = await supabase
    .schema("pgmq_public")
    .rpc("read", {
      queue_name: queueName,
      sleep_seconds: 5,
      n: 5,
    });

  if (error) {
    console.error(
      `Error reading from ${queueName} queue:`,
      error,
    );
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  if (!messages || messages.length === 0) {
    console.info(
      `No messages in ${queueName} queue`,
    );
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  console.info(
    `Found ${messages.length} messages to process`,
  );

  for (const message of messages) {
    try {
      await processMessage(message);
    } catch (error) {
      console.error(
        `Failed processing message ${message.msg_id}:`,
        error,
      );
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: errors }),
      {
        status: 510,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return new Response(
    JSON.stringify({
      message: `Processed ${messages.length} messages`,
      count: messages.length,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});
