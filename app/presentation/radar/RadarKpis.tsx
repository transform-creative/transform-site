import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { SEGMENTS, SEGMENT_META, inSA, type ScoredOrg } from "~/business/radarBL";
import "../../app-v2.css";

interface Props {
  orgs: ScoredOrg[];
}

/******************************
 * Headline counts: each segment (SA big, national underneath), how many fit
 * orgs have a warm signal, and how many are pass-through.
 */
export function RadarKpis({ orgs }: Props) {
  const context: SharedContextProps = useOutletContext();
  const sa = orgs.filter((o) => inSA(o.row));
  const count = (list: ScoredOrg[], test: (o: ScoredOrg) => boolean) =>
    list.filter(test).length.toLocaleString("en-AU");

  const tiles = [
    ...SEGMENTS.map((seg) => ({
      key: seg,
      label: SEGMENT_META[seg].label,
      blurb: SEGMENT_META[seg].blurb,
      sa: count(sa, (o) => o.segment === seg),
      national: count(orgs, (o) => o.segment === seg),
    })),
    {
      key: "warm",
      label: "Warm now",
      blurb: "Fit orgs with at least one warm signal.",
      sa: count(sa, (o) => o.signals.length > 0),
      national: count(orgs, (o) => o.signals.length > 0),
    },
    {
      key: "pass",
      label: "Pass-through",
      blurb: "Most money goes straight back out as grants.",
      sa: count(sa, (o) => !!o.row.pass_through),
      national: count(orgs, (o) => !!o.row.pass_through),
    },
  ];

  return (
    <section
      className="grid-110"
      style={{ gridTemplateColumns: context.inShrink ? "repeat(2, 1fr)" : "repeat(6, 1fr)" }}
      aria-label="Key numbers"
    >
      {tiles.map((t) => (
        <div key={t.key} className="stat-tile col gap-5" title={t.blurb}>
          <p className="field-label">{t.label}</p>
          <strong className="num" style={{ fontSize: "2rem", lineHeight: 1.1 }}>
            {t.sa}
          </strong>
          <small className="text-sm muted num">SA · {t.national} national</small>
        </div>
      ))}
    </section>
  );
}
