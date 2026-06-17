// Shared styles + brand constants for every Transform Creative react-email
// template. The palette and rhythm here mirror `dump/sign-up-email.html` so
// every generated email feels like part of the same family.

export const baseUrl =
  "https://transformcreative.com.au";
export const supportEmail =
  "support@transformcreative.org.au";
export const brandName = "Transform Creative";

// Palette — pulled from app.css so emails track the on-site brand exactly.
export const colors = {
  txt: "#191919",
  bkg: "#e2e1d8",
  bkgDim: "#bebeb6",
  card: "#ffffff",
  accent: "#436940",
  secondary: "#de976f",
  third: "#94bc91",
  muted: "#575653",
  danger: "#a83232",
};

export const main = {
  backgroundColor: colors.bkg,
  fontFamily:
    '"Onest", Helvetica, Arial, sans-serif',
  padding: "40px 20px",
};

export const container = {
  backgroundColor: colors.card,
  margin: "0 auto",
  maxWidth: "560px",
  borderRadius: "5px",
  overflow: "hidden",
  color: colors.txt,
  lineHeight: 1.6,
  letterSpacing: "0.2px",
};

export const header = {
  backgroundColor: colors.accent,
  padding: "28px 40px",
};

export const headerTitle = {
  margin: 0,
  color: colors.bkg,
  fontSize: "22px",
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
};

export const body = {
  padding: "40px 40px 32px 40px",
};

export const h1 = {
  margin: "0 0 20px 0",
  color: colors.txt,
  fontSize: "24px",
  fontFamily:
    '"Onest", Helvetica, Arial, sans-serif',
};

export const h2 = {
  margin: "0 0 12px 0",
  color: colors.txt,
  fontSize: "18px",
  fontFamily:
    '"Onest", Helvetica, Arial, sans-serif',
};

export const p = {
  margin: "0 0 16px 0",
  color: colors.txt,
  fontSize: "15px",
};

export const small = {
  margin: 0,
  color: colors.muted,
  fontSize: "13px",
};

// Buttons. The "primary" mirrors the dump email's accent CTA.
export const buttonPrimary = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: colors.accent,
  color: colors.bkg,
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: "5px",
};

export const buttonSecondary = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: colors.bkg,
  color: colors.txt,
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: "5px",
  border: `1px solid ${colors.bkgDim}`,
};

export const link = {
  color: colors.accent,
  textDecoration: "underline",
};

// The cream panel inside the body that highlights tokens / call-outs in the
// sign-up email. We reuse it as a generic info card for issue details.
export const card = {
  margin: "0 0 28px 0",
  padding: "20px",
  backgroundColor: colors.bkg,
  borderRadius: "5px",
};

export const detailRow = {
  margin: "0 0 6px 0",
  color: colors.txt,
  fontSize: "14px",
};

export const label = {
  color: colors.muted,
  fontWeight: 600 as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  fontSize: "12px",
  marginRight: "8px",
};

export const footer = {
  padding: "24px 40px",
  backgroundColor: colors.bkg,
  borderTop: `1px solid ${colors.bkgDim}`,
};

export const footerLine = {
  margin: "0 0 4px 0",
  color: colors.txt,
  fontSize: "14px",
};

// Map issue severity to a pill colour. Mirrors `severityColor()` in
// `app/business/commonBL.tsx` but inlined so the edge function stays
// self-contained.
export function severityColor(
  severity?: string | null,
): string {
  switch (severity) {
    case "critical":
      return "#a83232";
    case "severe":
      return "#c44e3e";
    case "moderate":
      return "#d4953f";
    case "low":
      return colors.accent;
    case "future":
      return colors.third;
    default:
      return colors.third;
  }
}

// Title-case helper for one-off labels (severity / type pills).
export function titleCase(value?: string | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Format an ISO timestamp as "Mon 1 Jan 2026, 9:30am" for email bodies.
export function formatTimestamp(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
