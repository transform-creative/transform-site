import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { fmtMoney, type MoneyPoint } from "~/business/radarBL";
import "../../app-v2.css";

interface Props {
  points: MoneyPoint[];
}

const W = 520;
const H = 190;
const PAD = { top: 14, right: 64, bottom: 26, left: 52 };

const SERIES = [
  { key: "revenue" as const, label: "Revenue", color: "var(--viz-1)" },
  { key: "donations" as const, label: "Donations", color: "var(--viz-2)" },
];

/******************************
 * Money over time: revenue and donations by financial year on one dollar axis.
 * Legend + end labels carry identity; hover shows a crosshair and the year's
 * values; the table underneath is the accessible view.
 */
export function MoneySparkline({ points }: Props) {
  useOutletContext<SharedContextProps>();
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="text-sm muted">No financials on file.</p>;
  }

  const max = niceMax(
    Math.max(...points.flatMap((p) => [p.revenue ?? 0, p.donations ?? 0]), 1)
  );
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;

  // End labels: nudge apart when the two lines finish close together
  const ends = SERIES.map((s) => {
    const i = lastDefined(points, s.key);
    return i == null ? null : { i, y: y(points[i][s.key]!) };
  });
  if (ends[0] && ends[1] && Math.abs(ends[0].y - ends[1].y) < 14) {
    const mid = (ends[0].y + ends[1].y) / 2;
    const [upper, lower] = ends[0].y <= ends[1].y ? [ends[0], ends[1]] : [ends[1], ends[0]];
    upper.y = mid - 7;
    lower.y = mid + 7;
  }

  return (
    <figure className="col gap-10 m0">
      <div className="row middle gap-20 text-sm">
        {SERIES.map((s) => (
          <div key={s.key} className="row middle gap-5">
            <div className="swatch" style={{ background: s.color, height: 3, width: 14 }} />
            <small>{s.label}</small>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-100"
          role="img"
          aria-label="Revenue and donations by financial year"
          onMouseLeave={() => setHover(null)}
        >
          {/* Recessive grid + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--viz-track)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--accent-lg)">
                {fmtMoney(t)}
              </text>
            </g>
          ))}
          {/* X labels */}
          {points.map((p, i) => (
            <text key={p.end} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--accent-lg)">
              {p.label}
            </text>
          ))}

          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--accent-lg)" strokeWidth={1} />
          )}

          {SERIES.map((s, si) => {
            const path = linePath(points.map((p, i) => (p[s.key] == null ? null : [x(i), y(p[s.key]!)])));
            const end = ends[si];
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) =>
                  p[s.key] == null ? null : (
                    <circle
                      key={p.end}
                      cx={x(i)}
                      cy={y(p[s.key]!)}
                      r={hover === i ? 5 : 4}
                      fill={s.color}
                      stroke="var(--bkg)"
                      strokeWidth={2}
                    />
                  )
                )}
                {end && (
                  <text
                    x={x(end.i) + 10}
                    y={end.y}
                    dominantBaseline="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--txt)"
                  >
                    {fmtMoney(points[end.i][s.key])}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hit targets: one full-height column per year, wider than the marks */}
          {points.map((p, i) => (
            <rect
              key={p.end}
              x={x(i) - step / 2}
              y={0}
              width={step}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {hover != null && (
          <div
            className="boxed p-10 col gap-5 raised text-sm"
            style={{
              position: "absolute",
              top: 0,
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover > points.length / 2 ? "-105%" : "5%"})`,
              pointerEvents: "none",
              minWidth: 140,
            }}
          >
            <strong>{points[hover].label}</strong>
            {SERIES.map((s) => (
              <div key={s.key} className="row middle gap-5">
                <div className="swatch" style={{ background: s.color }} />
                <small className="num">
                  {s.label} {fmtMoney(points[hover][s.key])}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      <table className="data-table num">
        <thead>
          <tr>
            <th>Year</th>
            <th>Revenue</th>
            <th>Donations</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.end}>
              <td>{p.label}</td>
              <td>{fmtMoney(p.revenue)}</td>
              <td>{fmtMoney(p.donations)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Round the axis top up to a clean 1 / 2 / 5 x 10^n */
function niceMax(v: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/** Line through defined points; gaps break the line */
function linePath(pts: ([number, number] | null)[]): string {
  let d = "";
  let pen = false;
  for (const p of pts) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${p[0]},${p[1]} `;
    pen = true;
  }
  return d.trim();
}

function lastDefined(points: MoneyPoint[], key: "revenue" | "donations"): number | null {
  for (let i = points.length - 1; i >= 0; i--) if (points[i][key] != null) return i;
  return null;
}
