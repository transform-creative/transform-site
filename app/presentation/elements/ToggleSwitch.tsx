import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import "../../app-v2.css";

export interface ToggleSwitchProps {
  on: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
  /** Accessible name for the switch */
  label?: string;
  /** Light selected segment + text, for use on an accent background */
  inverse?: boolean;
}

/******************************
 * ToggleSwitch component
 * Two-segment On / Off switch, as used in the savings calculator and the
 * church plan builder.
 */
export function ToggleSwitch({
  on,
  onChange,
  disabled,
  label,
  inverse = false,
}: ToggleSwitchProps) {
  const context: SharedContextProps = useOutletContext();
  const activeBkg = inverse ? "var(--bkg)" : "var(--accent)";
  const activeTxt = inverse ? "var(--accent)" : "var(--bkg)";
  const idleTxt = inverse ? "var(--bkg)" : "var(--txt)";

  return (
    <div
      className={`row ${inverse ? "outline-bkg" : "outline-secondary"}`}
      role="group"
      aria-label={label}
    >
      {[true, false].map((state) => (
        <button
          key={String(state)}
          type="button"
          disabled={disabled}
          aria-pressed={on === state}
          onClick={() => onChange(state)}
          style={{
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            borderRadius: "var(--borderRadius)",
            padding: "4px 14px",
            fontWeight: 700,
            transition: "0.2s",
            background: on === state ? activeBkg : "transparent",
            color: on === state ? activeTxt : idleTxt,
          }}
        >
          {state ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}
