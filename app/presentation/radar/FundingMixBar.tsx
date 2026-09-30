import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { OrgRadarRow } from "~/data/CustomTypes";
import { fmtMoney, fmtPct } from "~/business/radarBL";
import "../../app-v2.css";

interface Props {
  row: Pick<OrgRadarRow, "donations_share" | "gov_share" | "donations_bequests" | "revenue_gov">;
}

/******************************
 * Where the money comes from: donations vs government as a share of revenue.
 * The rest of the track is everything else (fees, investments...). Values are
 * always written out beside the bar, so colour is never the only cue.
 */
export function FundingMixBar({ row }: Props) {
  useOutletContext<SharedContextProps>();
  const don = clamp(row.donations_share);
  const gov = Math.min(clamp(row.gov_share), 1 - don);
  const label = `${fmtPct(row.donations_share)} donations · ${fmtPct(row.gov_share)} government`;

  return (
    <div className="col gap-5" title={`Donations ${fmtMoney(row.donations_bequests)} · Government ${fmtMoney(row.revenue_gov)}`}>
      <div className="bar-track" role="img" aria-label={label}>
        {don > 0 && <div style={{ width: `${don * 100}%`, background: "var(--viz-1)" }} />}
        {gov > 0 && <div style={{ width: `${gov * 100}%`, background: "var(--viz-2)" }} />}
      </div>
      <small className="text-sm muted num">{label}</small>
    </div>
  );
}

function clamp(n: number | null): number {
  if (n == null || isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** One-off key for the bar colours, shown above the list */
export function FundingMixLegend() {
  return (
    <div className="row middle gap-10 text-sm muted">
      <div className="row middle gap-5">
        <div className="swatch" style={{ background: "var(--viz-1)" }} />
        <small>Donations</small>
      </div>
      <div className="row middle gap-5">
        <div className="swatch" style={{ background: "var(--viz-2)" }} />
        <small>Government</small>
      </div>
      <div className="row middle gap-5">
        <div className="swatch" style={{ background: "var(--viz-track)" }} />
        <small>Other revenue</small>
      </div>
    </div>
  );
}
