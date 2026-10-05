import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { Icon } from "./Icon";
import "../../app-v2.css";

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Accessible name, e.g. "Shoots a year" */
  label?: string;
}

/******************************
 * Stepper component
 * A compact − n + counter, styled to sit beside ToggleSwitch.
 */
export function Stepper({
  value,
  min,
  max,
  onChange,
  disabled,
  label,
}: StepperProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div
      className="row middle outline-secondary"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="stepper-btn row middle center"
        aria-label={`Fewer ${label ?? ""}`.trim()}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Icon name="remove" size={12} />
      </button>
      <p className="num bold textCenter" style={{ minWidth: 28 }}>
        {value}
      </p>
      <button
        type="button"
        className="stepper-btn row middle center"
        aria-label={`More ${label ?? ""}`.trim()}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Icon name="add" size={12} />
      </button>
    </div>
  );
}
