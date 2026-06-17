import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import {
  baseUrl,
  formatTimestamp,
  h1,
  p,
  small,
} from "./styles.ts";
import {
  EmailButton,
  EmailFooter,
  EmailWrapper,
  IssueDetailsCard,
} from "./_EmailComponents.tsx";

/******************************
 * IssueForReviewClientEmail
 * Sent to a member of the reporting client's organisation when an issue has
 * been worked on and is now awaiting their sign-off. Recipient is resolved at
 * send time from the issue's reporting client (so the wording stays "your
 * issue", not "an issue").
 */
export interface IssueForReviewClientEmailProps {
  recipient_name?: string | null;
  issue_id?: number;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  issue_type?: string | null;
  more_info?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  business_name?: string | null;
  pr_url?: string | null;
}

export default function IssueForReviewClientEmail({
  recipient_name,
  issue_id,
  title,
  description,
  severity,
  issue_type,
  more_info,
  created_at,
  updated_at,
  business_name,
  pr_url,
}: IssueForReviewClientEmailProps) {
  const preview = title
    ? `Ready for review: ${title}`
    : "An issue you reported is ready for review.";

  const reviewUrl = `${baseUrl}/client`;

  return (
    <EmailWrapper previewText={preview}>
      <Heading style={h1}>
        Your issue is ready for review
      </Heading>

      <Text style={p}>
        {recipient_name
          ? `Hi ${recipient_name}, `
          : "Hi, "}
        we've finished working on the
        {title ? " " : ""}
        {title ? <strong>{title}</strong> : "issue"}{" "}
        you logged
        {business_name
          ? ` for ${business_name}`
          : ""}
        . When you've got a moment, please jump in
        and let us know whether it lands the way you
        were hoping.
      </Text>

      <IssueDetailsCard
        title={title}
        description={description}
        severity={severity}
        issue_type={issue_type}
        more_info={more_info}
        created_at={formatTimestamp(created_at)}
        business_name={business_name}
      />

      {updated_at ? (
        <Text style={p}>
          Marked ready for review on{" "}
          <strong>
            {formatTimestamp(updated_at)}
          </strong>
          .
        </Text>
      ) : null}

      <Section
        style={{
          margin: "24px 0 8px 0",
          textAlign: "center",
        }}
      >
        <EmailButton
          href={reviewUrl}
          label="Review the work"
        />
        {pr_url ? (
          <EmailButton
            href={pr_url}
            label="View pull request"
            variant="secondary"
            style={{ marginLeft: "8px" }}
          />
        ) : null}
      </Section>

      <Text style={small}>
        From inside the portal you can approve the
        work or send it back with feedback.
      </Text>

      <Text style={small}>
        Issue reference: #{issue_id ?? "—"}
      </Text>

      <EmailFooter />
    </EmailWrapper>
  );
}

export async function renderIssueForReviewClientEmail(
  props: IssueForReviewClientEmailProps,
): Promise<string> {
  return await render(
    React.createElement(
      IssueForReviewClientEmail,
      props,
    ),
  );
}
