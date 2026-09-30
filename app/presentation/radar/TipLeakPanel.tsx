import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { DEFAULT_TIP_LEAK, type TipLeakAssumptions } from "~/business/radarBL";
import "../../app-v2.css";

interface Props {
  value: TipLeakAssumptions;
  onChange: (value: TipLeakAssumptions) => void;
}

/******************************
 * The tip-leak what-if inputs. Clearly an estimate: a conversation starter
 * for Jenny's board, not a fact.
 */
export function TipLeakPanel({ value, onChange }: Props) {
  const context: SharedContextProps = useOutletContext();
  const isDefault =
    value.onlineShare === DEFAULT_TIP_LEAK.onlineShare &&
    value.tipRate === DEFAULT_TIP_LEAK.tipRate;

  return (
    <section className="stat-tile col gap-10" aria-label="Tip leak what-if">
      <div className="row between middle gap-10">
        <p className="field-label">Tip leak: what-if, not a fact</p>
        {!isDefault && (
          <button className="text-button text-sm accent-text" onClick={() => onChange(DEFAULT_TIP_LEAK)}>
            Reset
          </button>
        )}
      </div>
      <p className="text-sm">
        Donations × share raised online × donor tip kept by the platform. A conversation starter for
        Jenny's board.
      </p>
      <div className={`row gap-20 ${context.inShrink ? "col" : ""}`}>
        <label className="col gap-5 w-100 text-sm">
          Raised online: <strong className="num">{Math.round(value.onlineShare * 100)}%</strong>
          <input
            type="range"
            className="slider"
            min={0.05}
            max={0.8}
            step={0.05}
            value={value.onlineShare}
            onChange={(e) => onChange({ ...value, onlineShare: Number(e.target.value) })}
          />
        </label>
        <label className="col gap-5 w-100 text-sm">
          Donor tip: <strong className="num">{+(value.tipRate * 100).toFixed(1)}%</strong>
          <input
            type="range"
            className="slider"
            min={0.01}
            max={0.15}
            step={0.005}
            value={value.tipRate}
            onChange={(e) => onChange({ ...value, tipRate: Number(e.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}
