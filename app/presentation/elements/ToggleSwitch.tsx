import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import "../../app-v2.css";

export interface ToggleSwitchProps {
  on: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
  /** Accessible name for the switch */
  label?: string;
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
}: ToggleSwitchProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div
      className="row outline-secondary"
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
            background: on === state ? "var(--accent)" : "transparent",
            color: on === state ? "var(--bkg)" : "var(--txt)",
          }}
        >
          {state ? "On" : "Off"}
        </button>
      ))}
    </div>
  );
}
