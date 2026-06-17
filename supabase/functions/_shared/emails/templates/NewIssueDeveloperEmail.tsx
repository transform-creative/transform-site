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
 * NewIssueDeveloperEmail
 * Goes to support@transformcreative.org.au whenever a new row lands in
 * `issues`. Gives the dev team enough triage info — title, description,
 * severity/type pills, who reported it and against which business — to act
 * without first opening the portal.
 */
export interface NewIssueDeveloperEmailProps {
  issue_id?: number;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  issue_type?: string | null;
  more_info?: string | null;
  created_at?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  business_id?: number | null;
  business_name?: string | null;
  ai_status?: string | null;
  github_repo?: string | null;
}

export default function NewIssueDeveloperEmail({
  issue_id,
  title,
  description,
  severity,
  issue_type,
  more_info,
  created_at,
  reporter_name,
  reporter_email,
  business_id,
  business_name,
  ai_status,
  github_repo,
}: NewIssueDeveloperEmailProps) {
  const preview = title
    ? `New ${issue_type ?? "issue"}: ${title}`
    : "A new issue has been logged on the board.";

  const boardUrl = business_id
    ? `${baseUrl}/client/${business_id}`
    : `${baseUrl}/client`;

  return (
    <EmailWrapper previewText={preview}>
      <Heading style={h1}>
        New issue on the board
      </Heading>

      <Text style={p}>
        {reporter_name ?? "A client"} just logged a
        new{" "}
        {issue_type ? `${issue_type}` : "issue"}
        {business_name
          ? ` against ${business_name}`
          : ""}
        . The details are below — jump into the
        portal when you're ready to triage.
      </Text>

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

      {ai_status ? (
        <Text style={small}>
          AI auto-fix status:{" "}
          <strong>{ai_status}</strong>
          {github_repo
            ? ` · target repo ${github_repo}`
            : ""}
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

export async function renderNewIssueDeveloperEmail(
  props: NewIssueDeveloperEmailProps,
): Promise<string> {
  return await render(
    React.createElement(NewIssueDeveloperEmail, props),
  );
}
