// generateEmailBody — switchboard for every Transform Creative email.
//
// `sendEmail(data)` is called with the JSON message body that came off the
// `general_email_queue` pgmq queue. `data.type` drives the template / subject
// / recipient choice; templates are rendered to HTML with `@react-email/render`
// and posted to the Maileroo HTTP API for delivery.
//
// Add a new email by: (1) creating the template under
// `../_shared/emails/templates/`, (2) adding a `case` here, (3) emitting the
// matching `type` into the queue from a Postgres trigger or function.

/**@ts-ignore*/
import { render } from "npm:@react-email/render@0.0.12";
import NewIssueDeveloperEmail from "../_shared/emails/templates/NewIssueDeveloperEmail.tsx";
import IssueForReviewClientEmail from "../_shared/emails/templates/IssueForReviewClientEmail.tsx";

const endpoint = "https://smtp.maileroo.com/api/v2/emails/";

// Where developer / admin notifications go. Kept as a constant — also acts as
// the fallback recipient when a client-bound email is missing an address.
const DEVELOPER = {
  address: "support@transformcreative.com.au",
  display_name: "Transform Creative Support",
};

const SENDING_EMAIL = {
  address: "hello@transformcreative.com.au",
  display_name: "Transform Creative",
};

/*****************************************
 * Top-level dispatcher. The message payload's `type` field picks the template.
 */
export async function sendEmail(data: any) {
  switch (data.type) {
    case "issue.created":
      return await sendNewIssueDeveloperEmail(data);
    case "issue.ready_for_review":
      return await sendIssueForReviewClientEmail(data);
    default:
      return {
        error: `invalid_template ${data.type}`,
      };
  }
}

/*****************************************
 * Build the Maileroo HTTP request envelope (auth header + JSON body).
 */
function getEmailWithHeaders(payload: any) {
  return {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      /** @ts-ignore */
      "X-API-Key": `${Deno.env.get("MAILEROO_SENDING_KEY")}`,
      "content-type": "application/json",
    },
  };
}

/*****************************************
 * sendNewIssueDeveloperEmail — fires to support@transformcreative.org.au
 * whenever a new row lands in `issues`.
 */
async function sendNewIssueDeveloperEmail(data: any) {
  const emailBody = {
    to: DEVELOPER,
    from: SENDING_EMAIL,
    subject: `New ${data.issue_type ?? "issue"}${
      data.title ? `: ${data.title}` : ""
    }`,
    html: render(NewIssueDeveloperEmail(data)),
  };

  console.info("sending NewIssueDeveloperEmail", {
    issue_id: data.issue_id,
  });

  const response = await fetch(
    endpoint,
    getEmailWithHeaders(emailBody),
  );
  if (!response.ok) {
    const detail = await response.text();
    return {
      error: `Maileroo ${response.status} ${response.statusText}: ${detail}`,
    };
  }
  return { data: response };
}

/*****************************************
 * sendIssueForReviewClientEmail — goes to a member of the reporting client's
 * organisation when their issue is marked ready for review. `recipient_email`
 * is filled in by the queue producer (the SQL trigger) so this function only
 * needs to render + send.
 */
async function sendIssueForReviewClientEmail(data: any) {
  const emailBody = {
    to: {
      address: data.recipient_email || DEVELOPER.address,
      display_name:
        data.recipient_name || "Client",
    },
    from: SENDING_EMAIL,
    subject: data.title
      ? `Ready for your review: ${data.title}`
      : "An issue you reported is ready for review",
    html: render(IssueForReviewClientEmail(data)),
  };

  console.info("sending IssueForReviewClientEmail", {
    issue_id: data.issue_id,
    to: emailBody.to.address,
  });

  const response = await fetch(
    endpoint,
    getEmailWithHeaders(emailBody),
  );
  if (!response.ok) {
    const detail = await response.text();
    return {
      error: `Maileroo ${response.status} ${response.statusText}: ${detail}`,
    };
  }
  return { data: response };
}
