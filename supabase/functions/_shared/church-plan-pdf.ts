import {
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  PDFDocument,
  PDFString,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setCharacterSpacing,
  StandardFonts,
} from "npm:pdf-lib@1.17.1";
import type { PDFFont, PDFImage, PDFPage, RGB } from "npm:pdf-lib@1.17.1";

/************************
 * Church plan PDF — the one-page plan emailed from /church ("Email me this
 * plan"), built for a pastor to forward to their board. Layout and draw
 * helpers follow the Ping Pong-A-Thon tax receipt (receipt-pdf.ts).
 *
 * Line items and totals come in the queue payload (priced by churchPlanBL on
 * the site, so pricing has one source). The board Q&A and setup plan can't
 * be imported from the app (`~/` modules don't resolve under Deno), so they
 * live here — keep them in sync with BOARD_QA and CHURCH_WEEK in app/.
 */

export interface ChurchPlanPdfData {
  name: string;
  church: string;
  role?: string | null;
  /** `annual` is missing on leads saved before pricing went annual */
  lineItems: {
    id?: string;
    label: string;
    monthly: number;
    annual?: number;
  }[];
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

/** Short link printed under "Book a chat" for paper copies. Redirects to
 *  CHURCH_BOOKING_URL via the /chat redirect in vercel.json. */
const CHURCH_CHAT_URL = "transformcreative.com.au/chat";

/** White Transform Creative logo (icon + name) for the header band */
const LOGO_URL =
  "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/TC_LOGO_WHITE.png";

/** Photo behind the title, styled like the /church hero (dark scrim, light
 *  inset frame, white text) */
const HERO_IMAGE_URL =
  "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/images/churchpics_4.jpg";

/** Photo behind the setup plan box — a calm, evenly lit room shot so the
 *  white text over it stays readable */
const SETUP_IMAGE_URL =
  "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/images/churchpics_8.jpg";

/** Same heading as the board slideout (BoardPopup.tsx) — keep in sync */
const BOARD_TITLE = "Taking this to your board?";
const BOARD_SUBTITLE = "Here's what your treasurer and elders might ask.";

/** The plan's first line item (CHURCH_PLAN.base) is relabelled in the PDF */
const BASE_LABEL = "Strategy and feedback meetings + baseline costs";

/** The website build is a one-off cost, shown under the setup line instead */
const WEBSITE_BUILD_ID = "websiteBuild";
const SETUP_LABEL = "A new website for your church";

/** What we do first, from the "How does it actually work" steps
 *  (CHURCH_WEEK in app/data/Objects.tsx) and CHURCH_PLAN.base.note in
 *  app/business/churchPlanBL.tsx — keep in sync. */
const SETUP_PLAN = [
  "We meet to understand your community, heart, mission and style, and write your communications strategy plan.",
  "We visit to capture photos and video of your real people and events.",
  "We connect to your Planning Center or Elvanto, so your content and site stay current each week.",
  "We train your existing volunteers to fill any week-to-week gaps.",
  "We set up Spotify, Apple Podcasts and your Google Business Profile.",
  "We check in each quarter with a short report and a 30-min strategy and feedback meeting.",
];

/** Keep in sync with BOARD_TIME_BACK in app/data/Objects.tsx */
const BOARD_TIME_BACK =
  "If your team spends 3–4 hours a week on slides, notices and socials, that's four or five weeks of their year. This gives that time back for people and preaching.";

/** Keep in sync with CHURCH_PLAN.givingMembers in app/business/churchPlanBL.tsx */
const GIVING_MEMBERS = 200;

/** Keep in sync with perPersonWeekly in app/business/churchPlanBL.tsx */
function perPersonWeekly(annual: number): string {
  const cents = Math.round(((Number(annual) || 0) * 100) / GIVING_MEMBERS / 52);
  if (cents < 100) return `${cents} cents`;
  return `$${(cents / 100).toFixed(2)}`;
}

/** Keep in sync with BOARD_QA in app/data/Objects.tsx */
const BOARD_QA = [
  {
    question: "Is this a good use of our budget?",
    answer:
      "Fair question. What it pays for is people finding your church online, and your regulars knowing what's on, without it all landing on your pastor or a volunteer each week.",
  },
  {
    question: "How will we know it's working?",
    answer:
      "You'll get a short quarterly report with 'plan-a-visit' sign-ups (if you're on our website), sermon listens, email opens and feedback on how your socials are tracking. We'll go through it together each quarter. It's also worth asking newcomers how they found you, which is often the most useful number of all.",
  },
  {
    question: "What are we signing up to?",
    answer:
      "We collect payment in quarterly instalments. You can stop at any time, and your photos, video, templates, podcast feed and Google Business Profile are all yours.",
  },
  {
    question: "Who decides what goes out under our name?",
    answer:
      "You do. Anything we think could be potentially dicey waits for your pastor's yes.",
  },
  {
    question: "Why not use volunteers, or hire someone?",
    answer:
      "The more the merrier! We'd love to work alongside your existing team of legends. A two-day-a-week comms coordinator is roughly $30K a year with super, and it's pretty rare to find one person who can shoot, edit, design and look after a website.",
  },
  {
    question: "What about kids and privacy?",
    answer:
      "Our team all hold a Working With Children Check and a valid CPS training certificate. We endeavour to follow your church's photography policy. We don't ask for any children's details on our side, and any personal details collected are saved in your database, not ours.",
  },
];

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

// Type scale (points). 9pt = 12px, the smallest anything is drawn.
const SZ_H1 = 22;
const SZ_H2 = 14;
const SZ_H3 = 11;
const SZ_P = 10;
const SZ_SMALL = 9;
const LINE_GAP = 4;

/** Slightly tighter letter spacing, as a fraction of the font size */
const TRACKING = -0.02;

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

/** Plan labels are written from the church's side ("our church") — the PDF
 *  speaks to them, so flip them to "your". */
const yourWording = (text: string) =>
  text.replace(/\bour\b/g, "your").replace(/\bOur\b/g, "Your");

/** SVG path for a w×h rounded rectangle. drawSvgPath draws it from its
 *  (x, y) as the top-left corner, with y running downwards. */
function roundedPath(w: number, h: number, r: number): string {
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

/** Drawn width of `text`, including the TRACKING letter spacing. */
function textWidth(text: string, font: PDFFont, size: number): number {
  const s = safe(text, 2000);
  return (
    font.widthOfTextAtSize(s, size) +
    TRACKING * size * Math.max(0, s.length - 1)
  );
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
    if (textWidth(next, font, size) > maxWidth && line) {
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

  // A missing image shouldn't stop the plan going out — each falls back to a
  // plain version of its section
  async function fetchImage(
    url: string,
    type: "png" | "jpg",
  ): Promise<PDFImage | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      return type === "png"
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    } catch (err) {
      console.error(`church plan image fetch failed: ${url}`, err);
      return null;
    }
  }
  const [logo, hero, setupImage] = await Promise.all([
    fetchImage(LOGO_URL, "png"),
    fetchImage(HERO_IMAGE_URL, "jpg"),
    fetchImage(SETUP_IMAGE_URL, "jpg"),
  ]);

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
    opacity = 1,
  ) {
    // Character spacing is text state outside drawText's own q/Q, so it
    // carries into the drawText that follows
    page.pushOperators(setCharacterSpacing(TRACKING * sz));
    page.drawText(safe(text), {
      x,
      y: cy,
      size: sz,
      font: f,
      color,
      opacity,
    });
  }

  function txtRight(
    text: string,
    rightX: number,
    cy: number,
    sz: number,
    f = font,
    color: RGB = C_DARK,
  ) {
    txt(text, rightX - textWidth(text, f, sz), cy, sz, f, color);
  }

  /** One line of text in mixed fonts, e.g. a bold phrase mid-sentence. */
  function richLine(
    parts: [string, PDFFont][],
    x: number,
    cy: number,
    sz: number,
    color: RGB = C_DARK,
  ) {
    for (const [part, f] of parts) {
      txt(part, x, cy, sz, f, color);
      x += textWidth(part, f, sz) + TRACKING * sz;
    }
  }

  function fillRect(
    x: number,
    cy: number,
    w: number,
    h: number,
    fill: RGB,
    opacity = 1,
  ) {
    page.drawRectangle({ x, y: cy, width: w, height: h, color: fill, opacity });
  }

  /** Draw an image scaled to cover the box (bottom-left at x, cy), centred.
   *  Clip to the box first or the overflow shows. */
  function drawCover(img: PDFImage, x: number, cy: number, w: number, h: number) {
    const scale = Math.max(w / img.width, h / img.height);
    const imgW = img.width * scale;
    const imgH = img.height * scale;
    page.drawImage(img, {
      x: x + (w - imgW) / 2,
      y: cy + (h - imgH) / 2,
      width: imgW,
      height: imgH,
    });
  }

  /** Rounded rectangle with its top-left corner at (x, top). */
  function roundRect(
    x: number,
    top: number,
    w: number,
    h: number,
    r: number,
    fill: RGB,
  ) {
    page.drawSvgPath(roundedPath(w, h, r), { x, y: top, color: fill });
  }

  /** Clip what's drawn next to a rounded rectangle (bottom-left at x, cy).
   *  Pair with page.pushOperators(popGraphicsState()). */
  function clipRounded(x: number, cy: number, w: number, h: number, r: number) {
    const k = r * 0.5523; // bezier handle length for a quarter circle
    const x2 = x + w;
    const y2 = cy + h;
    page.pushOperators(
      pushGraphicsState(),
      moveTo(x + r, cy),
      lineTo(x2 - r, cy),
      appendBezierCurve(x2 - r + k, cy, x2, cy + r - k, x2, cy + r),
      lineTo(x2, y2 - r),
      appendBezierCurve(x2, y2 - r + k, x2 - r + k, y2, x2 - r, y2),
      lineTo(x + r, y2),
      appendBezierCurve(x + r - k, y2, x, y2 - r + k, x, y2 - r),
      lineTo(x, cy + r),
      appendBezierCurve(x, cy + r - k, x + r - k, cy, x + r, cy),
      closePath(),
      clip(),
      endPath(),
    );
  }

  /** A bold money figure with a muted "+ GST" after it, right-aligned. */
  function moneyPlusGst(value: number, rightX: number, cy: number, sz: number) {
    const gst = " + GST";
    const gstSz = SZ_SMALL;
    txtRight(gst, rightX, cy, gstSz, font, C_MUTED);
    txtRight(
      money(value),
      rightX - textWidth(gst, font, gstSz) - 2,
      cy,
      sz,
      fontBold,
      C_ACCENT,
    );
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
    sz = SZ_P,
    f = font,
    color: RGB = C_DARK,
    indent = 0,
  ) {
    for (const line of wrap(text, f, sz, CW - indent)) {
      ensureSpace(sz + LINE_GAP);
      y -= sz + LINE_GAP;
      txt(line, ML + indent, y, sz, f, color);
    }
  }

  /** Start a new page if the next block won't fit. */
  function ensureSpace(h: number) {
    if (y - h >= BOTTOM) return;
    newPage();
  }

  function newPage() {
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

  const bandH = 68;
  fillRect(0, PH - bandH, PW, bandH, C_ACCENT);
  if (logo) {
    const logoH = 46;
    const logoW = (logo.width / logo.height) * logoH;
    page.drawImage(logo, {
      x: ML - 3, // the PNG has a little padding on its left edge
      y: PH - bandH + (bandH - logoH) / 2,
      width: logoW,
      height: logoH,
    });
  } else {
    txt("Transform Creative", ML, PH - bandH / 2 - 5, SZ_H2, fontBold, C_WHITE);
  }
  // ── Who it's for ─────────────────────────────────────────────────────────

  const title = "Your church comms plan";
  const role = data.role ? `${safe(data.role, 40)} at ` : "";
  const preparedFor = `Prepared for ${safe(data.name, 80)} (${role}${safe(data.church, 80)}).`;

  if (hero) {
    // 4:1 photo card: image cropped to cover, dark scrim, inset frame
    y = PH - bandH - 24;
    const cardH = CW / 4;
    const cardY = y - cardH;
    clipRounded(ML, cardY, CW, cardH, 16);
    drawCover(hero, ML, cardY, CW, cardH);
    // Same wash as .scrim-dark (#00000099)
    fillRect(ML, cardY, CW, cardH, rgb(0, 0, 0), 0.6);
    page.pushOperators(popGraphicsState());

    const inset = 10;
    page.drawSvgPath(
      roundedPath(CW - inset * 2, cardH - inset * 2, 10),
      {
        x: ML + inset,
        y: y - inset,
        borderColor: C_WHITE,
        borderOpacity: 0.33,
        borderWidth: 1.5,
      },
    );

    // Text centred both ways in the card
    const centreX = (text: string, f: PDFFont, sz: number) =>
      ML + (CW - textWidth(text, f, sz)) / 2;
    const textW = CW - (inset + 18) * 2;
    const subLines = wrap(preparedFor, font, SZ_P, textW);
    const blockH = SZ_H1 + 8 + subLines.length * (SZ_P + LINE_GAP);
    let ty = cardY + (cardH + blockH) / 2 - SZ_H1 + 4;
    txt(title, centreX(title, fontBold, SZ_H1), ty, SZ_H1, fontBold, C_WHITE);
    ty -= 8;
    for (const line of subLines) {
      ty -= SZ_P + LINE_GAP;
      txt(line, centreX(line, font, SZ_P), ty, SZ_P, font, C_WHITE, 0.75);
    }
    y = cardY - 24;
  } else {
    y = PH - bandH - 40;
    txt(title, ML, y, SZ_H1, fontBold);
    y -= 6;
    paragraph(preparedFor, SZ_P, font, C_MUTED);
    y -= 20;
  }

  // ── Line items ───────────────────────────────────────────────────────────

  /** Shaded header row of a line-item table */
  function tableHeader(left: string, right: string) {
    const headerH = 24;
    fillRect(ML, y - headerH, CW, headerH, C_BG);
    txt(left, ML + 6, y - 15.5, SZ_P, fontBold);
    txtRight(right, ML + CW - 6, y - 15.5, SZ_P, fontBold, C_ACCENT);
    y -= headerH;
  }

  const rowH = 20;
  /** One line-item row; odd rows get the alternate shade */
  function tableRow(label: string, price: string, i: number, plusGst = false) {
    if (i % 2 === 1) fillRect(ML, y - rowH, CW, rowH, C_ROW_ALT);
    txt(safe(label, 80), ML + 6, y - 13.5, SZ_P);
    let right = ML + CW - 6;
    if (plusGst) {
      // Faded, like the "+ GST" beside the annual total
      const gst = " + GST";
      txtRight(gst, right, y - 13.5, SZ_SMALL, font, C_MUTED);
      right -= textWidth(gst, font, SZ_SMALL) + 2;
    }
    txtRight(price, right, y - 13.5, SZ_P);
    y -= rowH;
  }

  tableHeader("Your plan", "Annual");

  // The website build is a one-off, so it's priced in the setup table
  const lineItems = (data.lineItems ?? []).filter(
    (item) => item.id !== WEBSITE_BUILD_ID,
  );
  lineItems.slice(0, 16).forEach((item, i) => {
    // The base fee is always first (older leads have no id)
    const label = i === 0 ? BASE_LABEL : yourWording(item.label);
    tableRow(label, money(item.annual ?? item.monthly * 12), i);
  });
  hline(y, 0.8, C_ACCENT);

  // ── Annual total, between two rules ──────────────────────────────────────

  y -= 22;
  txt("Annual total", ML + 6, y, SZ_H3, fontBold);
  moneyPlusGst(data.annual, ML + CW - 6, y, SZ_H3);
  y -= 4 + SZ_P + LINE_GAP;
  richLine(
    [
      ["Paid in ", font],
      [`4x ${money(data.annual / 4)}`, fontBold],
      [" quarterly payments.", font],
    ],
    ML + 6,
    y,
    SZ_P,
    C_MUTED,
  );
  y -= 12;
  hline(y, 0.8, C_ACCENT);

  // ── One-off setup, set apart as its own cost ─────────────────────────────

  if (data.setup > 0) {
    y -= 28;
    tableHeader("One-off setup cost", "One-off");
    tableRow(SETUP_LABEL, money(data.setup), 0, true);
    hline(y, 0.8, C_ACCENT);
  }
  y -= 28;

  // ── Setup plan ───────────────────────────────────────────────────────────

  const pad = 18;
  const bulletIndent = 12;
  const lineH = SZ_P + LINE_GAP;
  const bulletGap = 4;
  const bulletLines = SETUP_PLAN.map((point) =>
    wrap(point, font, SZ_P, CW - pad * 2 - bulletIndent),
  );
  const boxH =
    pad * 2 +
    SZ_H2 +
    6 +
    bulletLines.reduce(
      (sum, lines) => sum + lines.length * lineH + bulletGap,
      0,
    );
  ensureSpace(boxH);
  if (setupImage) {
    // Like a selected item in the plan builder (.bg-blur-img +
    // .overlay-accent), with a heavier wash since the PDF can't blur
    clipRounded(ML, y - boxH, CW, boxH, 12);
    drawCover(setupImage, ML, y - boxH, CW, boxH);
    fillRect(ML, y - boxH, CW, boxH, C_ACCENT, 0.9);
    page.pushOperators(popGraphicsState());
  } else {
    roundRect(ML, y, CW, boxH, 12, C_ACCENT);
  }
  let by = y - pad - SZ_H2 + 2;
  txt("Setup plan", ML + pad, by, SZ_H2, fontBold, C_WHITE);
  by -= 6;
  for (const lines of bulletLines) {
    lines.forEach((line, i) => {
      by -= lineH;
      if (i === 0) txt("•", ML + pad, by, SZ_P, fontBold, C_WHITE);
      txt(line, ML + pad + bulletIndent, by, SZ_P, font, C_WHITE);
    });
    by -= bulletGap;
  }

  // ── Board Q&A, on its own page ───────────────────────────────────────────

  newPage();
  y -= SZ_H2;
  y -= SZ_H1 - SZ_H2;
  txt(BOARD_TITLE, ML, y, SZ_H1, fontBold, C_ACCENT);
  y -= 4;
  paragraph(BOARD_SUBTITLE, SZ_P, font, C_MUTED);
  y -= 6;
  for (const qa of BOARD_QA) {
    ensureSpace(40);
    y -= 12;
    paragraph(qa.question, SZ_H3, fontBold);
    y -= 1;
    paragraph(qa.answer);
  }

  // Time + cost in context, closing out the board answers
  ensureSpace(40);
  y -= 16;
  paragraph(
    `${BOARD_TIME_BACK} For a church with ${GIVING_MEMBERS} giving members, that's ${perPersonWeekly(data.annual)} per person, per week.`,
    SZ_P,
    fontBold,
  );
  y -= 20;

  // ── Book a chat ──────────────────────────────────────────────────────────

  const chatH = 68;
  ensureSpace(chatH);
  roundRect(ML, y, CW, chatH, 12, C_BG);
  txt("Book a chat", ML + pad, y - 21, SZ_H2, fontBold, C_ACCENT);
  richLine(
    [
      ["Got questions? We'd love to answer all of them. ", font],
      ["Click here", fontBold],
      [" to pick a time for us to call you!", font],
    ],
    ML + pad,
    y - 38,
    SZ_P,
  );
  // Printed copies can't be clicked, so spell out a short link too
  txt(CHURCH_CHAT_URL, ML + pad, y - 55, SZ_P, fontBold, C_ACCENT);
  addLink(ML, y - chatH, CW, chatH, CHURCH_BOOKING_URL);

  return await pdfDoc.save();
}
