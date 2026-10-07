import {
  PDFDocument,
  PDFString,
  rgb,
  StandardFonts,
} from "npm:pdf-lib@1.17.1";
import type { PDFFont, PDFPage, RGB } from "npm:pdf-lib@1.17.1";

/************************
 * Church plan PDF — the one-page plan emailed from /church ("Email me this
 * plan"), built for a pastor to forward to their board. Layout and draw
 * helpers follow the Ping Pong-A-Thon tax receipt (receipt-pdf.ts).
 *
 * Line items and totals come in the queue payload (priced by churchPlanBL on
 * the site, so pricing has one source). The board Q&A, inclusions and
 * footnote can't be imported from the app (`~/` modules don't resolve under
 * Deno), so they live here — keep them in sync with BOARD_QA,
 * CHURCH_PLAN.base and CHURCH_FOOTNOTE in app/.
 */

export interface ChurchPlanPdfData {
  name: string;
  church: string;
  role?: string | null;
  /** `annual` is missing on leads saved before pricing went annual */
  lineItems: { label: string; monthly: number; annual?: number }[];
  monthly: number;
  setup: number;
  annual: number;
  hoursBack?: number | null;
  coordinator?: string | null;
  submittedAt?: string | null;
}

/** Keep in sync with CONTACT.bookingUrl in app/data/Objects.tsx */
export const CHURCH_BOOKING_URL =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2neXINmRa2l8cPxCMY8-FrrTt30-Tpwfj7-zqktFODuuJO9Z_wsSfv2wcNkiFvipiOl58trJuc";

/** Keep in sync with CHURCH_PLAN.base.note in app/business/churchPlanBL.tsx */
const ALWAYS_INCLUDED =
  "Quarterly invite plan + 30-min call, start-up setup (Spotify, Apple Podcasts, Google Business Profile), monthly report.";

/** Keep in sync with BOARD_QA in app/data/Objects.tsx */
const BOARD_QA = [
  {
    question: "How does it compare to hiring?",
    answer:
      "A typical plan is about $19K a year ex GST. A two-day-a-week comms coordinator is roughly $30K with super, and one person rarely covers shooting, editing and web work as well.",
  },
  {
    question: "What are we signing up to?",
    // TODO: exit terms
    answer:
      "An annual plan on a 12-month term, paid in four quarterly instalments.",
  },
  {
    question: "What do we keep if we stop?",
    // TODO: confirm what happens to the hosted pages if a church leaves
    answer:
      "Your photos, video, templates, podcast feed and Google Business Profile are yours, and visitor details already live in your Elvanto or PCO.",
  },
  {
    question: "Who's filming in our building?",
    // TODO: confirm the shooter's Working With Children Check
    answer:
      "Our shooter holds a Working With Children Check and follows your church's photography policy.",
  },
  {
    question: "What data do you hold?",
    answer:
      "Plan a visit only asks for name, contact details, service and group size. No children's details, and it goes straight into your system.",
  },
  {
    question: "Who controls what's said?",
    answer:
      "Promos publish unless you flag them by Thursday. Anything theological needs a yes from your pastor.",
  },
];

/** Keep in sync with CHURCH_FOOTNOTE in app/data/Objects.tsx */
const FOOTNOTE =
  "*Illustrative pricing, ex GST, annual on a 12-month term, paid quarterly. Hours are based on what this took at Kings Baptist. Coordinator cost uses an average Australian comms coordinator salary of about $68K plus 12% super (Payscale, 2026).";

// Brand colours matching app.css and email styles.ts
const C_ACCENT = rgb(67 / 255, 105 / 255, 64 / 255); // --accent #436940
const C_DARK = rgb(25 / 255, 25 / 255, 25 / 255); // --txt #191919
const C_BG = rgb(226 / 255, 225 / 255, 216 / 255); // --bkg #e2e1d8
const C_MUTED = rgb(87 / 255, 86 / 255, 83 / 255); // --accent-lg #575653
const C_WHITE = rgb(1, 1, 1);
const C_BORDER = rgb(190 / 255, 190 / 255, 182 / 255); // #bebeb6
const C_ROW_ALT = rgb(244 / 255, 243 / 255, 238 / 255);

// A4 page layout constants (points)
const PW = 595;
const PH = 842;
const ML = 40; // left margin
const CW = PW - ML - 40; // content width = 515
const BOTTOM = 40;

/** Standard fonts are WinAnsi only — swap the few symbols the copy uses and
 *  drop anything else that can't be encoded (it would throw). */
function safe(text: string, max = 400): string {
  return String(text ?? "")
    .replace(/≈/g, "~")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•…]/g, "")
    .slice(0, max);
}

const money = (n: number) =>
  `$${Math.round(Number(n) || 0).toLocaleString("en-AU")}`;

function fmtDate(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const date = isNaN(d.getTime()) ? new Date() : d;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Adelaide",
  });
}

/** Split text into lines no wider than `maxWidth`. */
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of safe(text, 2000).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/*******************************
 * generateChurchPlanPdf
 * Builds the A4 plan PDF. Returns raw bytes for an email attachment.
 */
export async function generateChurchPlanPdf(
  data: ChurchPlanPdfData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${safe(data.church, 80)} — church comms plan`);
  pdfDoc.setAuthor("Transform Creative");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(
    StandardFonts.HelveticaOblique,
  );

  // Mutable page state — inner functions close over these
  let page: PDFPage = pdfDoc.addPage([PW, PH]);
  let y = PH;

  // ── Low-level draw helpers ───────────────────────────────────────────────

  function txt(
    text: string,
    x: number,
    cy: number,
    sz: number,
    f = font,
    color: RGB = C_DARK,
  ) {
    page.drawText(safe(text), { x, y: cy, size: sz, font: f, color });
  }

  function txtRight(
    text: string,
    rightX: number,
    cy: number,
    sz: number,
    f = font,
    color: RGB = C_DARK,
  ) {
    const s = safe(text);
    page.drawText(s, {
      x: rightX - f.widthOfTextAtSize(s, sz),
      y: cy,
      size: sz,
      font: f,
      color,
    });
  }

  function fillRect(x: number, cy: number, w: number, h: number, fill: RGB) {
    page.drawRectangle({ x, y: cy, width: w, height: h, color: fill });
  }

  function hline(cy: number, thickness = 0.5, color: RGB = C_BORDER) {
    page.drawLine({
      start: { x: ML, y: cy },
      end: { x: ML + CW, y: cy },
      thickness,
      color,
    });
  }

  /** Wrapped paragraph from the current y; moves y below it. */
  function paragraph(
    text: string,
    sz: number,
    f = font,
    color: RGB = C_DARK,
    lineGap = 3,
  ) {
    for (const line of wrap(text, f, sz, CW)) {
      ensureSpace(sz + lineGap);
      y -= sz + lineGap;
      txt(line, ML, y, sz, f, color);
    }
  }

  /** Start a new page if the next block won't fit. */
  function ensureSpace(h: number) {
    if (y - h >= BOTTOM) return;
    page = pdfDoc.addPage([PW, PH]);
    y = PH - BOTTOM;
  }

  function addLink(x: number, cy: number, w: number, h: number, url: string) {
    const annot = pdfDoc.context.register(
      pdfDoc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, cy, x + w, cy + h],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
      }),
    );
    page.node.addAnnot(annot);
  }

  // ── Header ───────────────────────────────────────────────────────────────

  fillRect(0, PH - 68, PW, 68, C_ACCENT);
  txt("Transform Creative", ML, PH - 32, 16, fontBold, C_WHITE);
  txt("Church comms, done for you", ML, PH - 48, 9, font, C_WHITE);
  txtRight("Your church comms plan", PW - 40, PH - 38, 14, fontBold, C_WHITE);
  y = PH - 100;

  // ── Who it's for ─────────────────────────────────────────────────────────

  txt(safe(data.church, 80), ML, y, 18, fontBold);
  y -= 16;
  const preparedFor = [
    `Prepared for ${safe(data.name, 80)}`,
    data.role ? `(${safe(data.role, 40)})` : "",
    `· ${fmtDate(data.submittedAt)}`,
  ]
    .filter(Boolean)
    .join(" ");
  txt(preparedFor, ML, y, 9, font, C_MUTED);
  y -= 24;

  // ── Line items ───────────────────────────────────────────────────────────

  const headerH = 22;
  fillRect(ML, y - headerH, CW, headerH, C_BG);
  txt("Your plan", ML + 6, y - 14, 9, fontBold);
  txtRight("Annual, ex GST", ML + CW - 6, y - 14, 9, fontBold, C_ACCENT);
  y -= headerH;

  const rowH = 18;
  (data.lineItems ?? []).slice(0, 16).forEach((item, i) => {
    if (i % 2 === 1) fillRect(ML, y - rowH, CW, rowH, C_ROW_ALT);
    txt(safe(item.label, 80), ML + 6, y - 12, 9.5);
    txtRight(
      money(item.annual ?? item.monthly * 12),
      ML + CW - 6,
      y - 12,
      9.5,
    );
    y -= rowH;
  });
  hline(y, 0.8, C_ACCENT);

  // ── Totals ───────────────────────────────────────────────────────────────

  const totals: [string, string][] = [
    ["Annual total, ex GST", money(data.annual)],
    ["Quarterly payment (x4), ex GST", money(data.annual / 4)],
  ];
  if (data.setup > 0)
    totals.push(["One-off setup, ex GST", money(data.setup)]);

  for (const [label, value] of totals) {
    y -= 18;
    txt(label, ML + 6, y, 10.5, fontBold);
    txtRight(value, ML + CW - 6, y, 10.5, fontBold, C_ACCENT);
  }
  y -= 8;

  const extras = [
    "Annual plan on a 12-month term, paid quarterly.",
    data.hoursBack ? `About ${data.hoursBack} hrs a week back.*` : "",
    data.coordinator
      ? `About the cost of ${safe(data.coordinator, 20)} a week of a comms coordinator.*`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  paragraph(extras, 9, font, C_MUTED);
  y -= 12;

  // ── Always included ──────────────────────────────────────────────────────

  ensureSpace(30);
  y -= 11;
  txt("Always included", ML, y, 11, fontBold, C_ACCENT);
  paragraph(ALWAYS_INCLUDED, 9);
  y -= 14;

  // ── Board Q&A ────────────────────────────────────────────────────────────

  ensureSpace(30);
  y -= 11;
  txt("What your board will probably ask", ML, y, 11, fontBold, C_ACCENT);
  y -= 4;
  for (const qa of BOARD_QA) {
    ensureSpace(30);
    y -= 8;
    paragraph(qa.question, 9, fontBold);
    paragraph(qa.answer, 8.5);
  }
  y -= 14;

  // ── Book a chat ──────────────────────────────────────────────────────────

  ensureSpace(46);
  const boxH = 40;
  fillRect(ML, y - boxH, CW, boxH, C_BG);
  txt("Book a chat", ML + 12, y - 17, 11, fontBold, C_ACCENT);
  txt(
    "A no-pressure 20 minutes to talk it through. Click here to pick a time.",
    ML + 12,
    y - 31,
    9,
  );
  addLink(ML, y - boxH, CW, boxH, CHURCH_BOOKING_URL);
  y -= boxH + 10;

  // ── Footnote ─────────────────────────────────────────────────────────────

  paragraph(FOOTNOTE, 7, fontItalic, C_MUTED, 2);

  return await pdfDoc.save();
}
