import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import { baseUrl, card, h1, label, p, small } from "./styles.ts";
import {
  EmailButton,
  EmailFooter,
  EmailWrapper,
} from "./_EmailComponents.tsx";

/******************************
 * ChurchPlanEmail
 * Sent when someone uses "Email me this plan" on /church. The plan itself is
 * the attached PDF; this is the short note that carries it.
 */
export interface ChurchPlanEmailProps {
  name?: string | null;
  church?: string | null;
  monthly?: number | null;
  setup?: number | null;
  annual?: number | null;
  booking_url: string;
  pdf_attached?: boolean;
}

const money = (n?: number | null) =>
  `$${Math.round(Number(n) || 0).toLocaleString("en-AU")}`;

export default function ChurchPlanEmail({
  name,
  church,
  monthly,
  setup,
  annual,
  booking_url,
  pdf_attached = true,
}: ChurchPlanEmailProps) {
  const preview = `Your church comms plan: ${money(monthly)} a month ex GST`;

  return (
    <EmailWrapper previewText={preview}>
      <Heading style={h1}>Here's your plan</Heading>

      <Text style={p}>
        {name ? `Hi ${name}, ` : "Hi, "}
        thanks for building a plan
        {church ? ` for ${church}` : ""}.{" "}
        {pdf_attached
          ? "It's attached as a one-page PDF, ready to forward to your board, with answers to the questions they'll probably ask."
          : "Here's the summary. Reply to this email and I'll send through the full one-page PDF for your board."}
      </Text>

      <Section style={card}>
        <Text style={label}>Your plan, ex GST</Text>
        <Text style={{ ...p, margin: 0 }}>
          <strong>{money(monthly)} a month</strong> on a 12-month term (
          {money(annual)} a year)
          {setup ? `, plus ${money(setup)} one-off setup` : ""}.
        </Text>
      </Section>

      <Text style={p}>
        If you'd like to talk it through, grab a no-pressure 20-minute chat.
        Or just reply to this email.
      </Text>

      <Section style={{ margin: "24px 0 8px 0", textAlign: "center" }}>
        <EmailButton href={booking_url} label="Book a chat" />
        <EmailButton
          href={`${baseUrl}/church#plan`}
          label="Tweak your plan"
          variant="secondary"
          style={{ marginLeft: "8px" }}
        />
      </Section>

      <Text style={small}>
        Isaac, Transform Creative. Pricing is illustrative and ex GST.
      </Text>

      <EmailFooter />
    </EmailWrapper>
  );
}

export async function renderChurchPlanEmail(
  props: ChurchPlanEmailProps,
): Promise<string> {
  return await render(React.createElement(ChurchPlanEmail, props));
}
