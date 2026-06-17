import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import {
  baseUrl,
  card,
  formatTimestamp,
  h1,
  label,
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
 * IssueRejectedDeveloperEmail
 * Goes to support@transformcreative.com.au when a client sends an issue back
 * (sets `rejected_at`). The portal forces a comment on reject, so
 * `latest_comment` carries the client's feedback on what's still wrong — surfaced
 * prominently here so devs can act without first opening the portal.
 */
export interface IssueRejectedDeveloperEmailProps {
  issue_id?: number;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  issue_type?: string | null;
  more_info?: string | null;
  created_at?: string | null;
  rejected_at?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  business_name?: string | null;
  latest_comment?: string | null;
}

export default function IssueRejectedDeveloperEmail({
  issue_id,
  title,
  description,
  severity,
  issue_type,
  more_info,
  created_at,
  rejected_at,
  reporter_name,
  reporter_email,
  business_name,
  latest_comment,
}: IssueRejectedDeveloperEmailProps) {
  const preview = title
    ? `Sent back: ${title}`
    : "A client has sent an issue back for more work.";

  // `/client` forwards whoever clicks to their own board.
  const boardUrl = `${baseUrl}/client`;

  return (
    <EmailWrapper previewText={preview}>
      <Heading style={h1}>
        An issue was sent back
      </Heading>

      <Text style={p}>
        {reporter_name ?? "A client"} sent the
        {title ? " " : ""}
        {title ? <strong>{title}</strong> : "issue"}
        {business_name
          ? ` for ${business_name}`
          : ""}{" "}
        back for more work. Their feedback is below —
        jump into the portal to pick it up again.
      </Text>

      {latest_comment ? (
        <Section style={card}>
          <Text style={label}>Client's feedback</Text>
          <Text style={{ ...p, margin: 0 }}>
            {latest_comment}
          </Text>
        </Section>
      ) : null}

      <IssueDetailsCard
        title={title}
        description={description}
        severity={severity}
        issue_type={issue_type}
        more_info={more_info}
        created_at={formatTimestamp(created_at)}
        reporter_name={
          reporter_email
            ? `${reporter_name ?? "Client"} <${reporter_email}>`
            : reporter_name
        }
        business_name={business_name}
      />

      {rejected_at ? (
        <Text style={small}>
          Sent back on{" "}
          <strong>{formatTimestamp(rejected_at)}</strong>.
        </Text>
      ) : null}

      <Section
        style={{
          margin: "24px 0 8px 0",
          textAlign: "center",
        }}
      >
        <EmailButton
          href={boardUrl}
          label="Open the board"
        />
      </Section>

      <Text style={small}>
        Issue reference: #{issue_id ?? "—"}
      </Text>

      <EmailFooter />
    </EmailWrapper>
  );
}

export async function renderIssueRejectedDeveloperEmail(
  props: IssueRejectedDeveloperEmailProps,
): Promise<string> {
  return await render(
    React.createElement(
      IssueRejectedDeveloperEmail,
      props,
    ),
  );
}
