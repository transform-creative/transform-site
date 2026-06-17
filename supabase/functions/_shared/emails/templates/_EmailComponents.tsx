import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import {
  body,
  brandName,
  buttonPrimary,
  buttonSecondary,
  card,
  colors,
  container,
  detailRow,
  footer,
  footerLine,
  header,
  headerTitle,
  label,
  main,
  severityColor,
  small,
  supportEmail,
  titleCase,
} from "./styles.ts";

/******************************
 * EmailButton — accent CTA matching the dump/sign-up-email.html button.
 * Use `variant="secondary"` for a softer, beige call-to-action.
 */
export interface EmailButtonProps {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  style?: React.CSSProperties;
}

export function EmailButton({
  href,
  label,
  variant = "primary",
  style,
}: EmailButtonProps) {
  return (
    <Link
      style={{
        ...(variant === "primary"
          ? buttonPrimary
          : buttonSecondary),
        ...style,
      }}
      href={href}
    >
      {label}
    </Link>
  );
}

/******************************
 * EmailFooter — the cream sign-off block at the bottom of every email.
 */
export function EmailFooter() {
  return (
    <Section style={footer}>
      <Text style={footerLine}>
        Sent by {brandName}.
      </Text>
      <Text style={small}>
        Questions? Email us at{" "}
        <Link
          href={`mailto:${supportEmail}`}
          style={{
            color: colors.accent,
            textDecoration: "underline",
          }}
        >
          {supportEmail}
        </Link>
        .
      </Text>
    </Section>
  );
}

/******************************
 * EmailWrapper — outer cream pad + white card with the Transform Creative
 * header bar. Every email template renders its body inside this.
 */
export interface EmailWrapperProps {
  previewText: string;
  children: React.ReactNode;
}

export function EmailWrapper({
  previewText,
  children,
}: EmailWrapperProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              {brandName}
            </Heading>
          </Section>
          <Section style={body}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}

/******************************
 * Pill — small coloured badge used for severity / issue type.
 */
export interface PillProps {
  text: string;
  color?: string;
  style?: React.CSSProperties;
}

export function Pill({
  text,
  color = colors.accent,
  style,
}: PillProps) {
  return (
    <Text
      style={{
        display: "inline-block",
        padding: "3px 10px",
        backgroundColor: color,
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderRadius: "999px",
        margin: "0 6px 0 0",
        ...style,
      }}
    >
      {text}
    </Text>
  );
}

/******************************
 * IssueDetailsCard — the cream info panel summarising an issue for both the
 * developer notification and the client review-ready email. Keeps the two
 * templates visually identical for the data block, only the surrounding copy
 * changes.
 */
export interface IssueDetailsCardProps {
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  issue_type?: string | null;
  created_at?: string | null;
  more_info?: string | null;
  reporter_name?: string | null;
  business_name?: string | null;
}

export function IssueDetailsCard({
  title,
  description,
  severity,
  issue_type,
  created_at,
  more_info,
  reporter_name,
  business_name,
}: IssueDetailsCardProps) {
  return (
    <Section style={card}>
      {title ? (
        <Text
          style={{
            margin: "0 0 12px 0",
            color: colors.txt,
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          {title}
        </Text>
      ) : null}

      <Section style={{ margin: "0 0 14px 0" }}>
        {issue_type ? (
          <Pill
            text={titleCase(issue_type)}
            color={colors.accent}
          />
        ) : null}
        {severity ? (
          <Pill
            text={titleCase(severity)}
            color={severityColor(severity)}
          />
        ) : null}
      </Section>

      {description ? (
        <Text style={{ ...detailRow, marginBottom: 14 }}>
          {description}
        </Text>
      ) : null}

      {more_info ? (
        <Text style={detailRow}>
          <Text style={label}>More info</Text>
          {more_info}
        </Text>
      ) : null}

      {reporter_name ? (
        <Text style={detailRow}>
          <Text style={label}>Reported by</Text>
          {reporter_name}
        </Text>
      ) : null}

      {business_name ? (
        <Text style={detailRow}>
          <Text style={label}>Business</Text>
          {business_name}
        </Text>
      ) : null}

      {created_at ? (
        <Text style={detailRow}>
          <Text style={label}>Logged</Text>
          {created_at}
        </Text>
      ) : null}
    </Section>
  );
}
