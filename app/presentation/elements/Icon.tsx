import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import IonIcon from "./IonIcon";
import { IoniconName } from "~/data/Ionicons";
import { CSSProperties } from "react";

export interface IconProps {
  id?: string,
  name: IoniconName;
  style?:CSSProperties
  size?: number;
  color?:string;
  onClick?: () => void;
  className?: string;
}

/******************************
 * Icon component
 * @todo Create description
 */
export function Icon({
  id,
  name,
  style,
  color="var(--txt)",
  className = "",
  size = 12,
  onClick
}: IconProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div id={id}>
      <IonIcon
      onClick={() => onClick && onClick()}
        name={name}
        className={`${onClick && "clickable"} ${className}`}
        style={{
          ...style,
          height: `${size}pt`,
          width: `${size}pt`,
          display: "flex",
          color: color
        }}
      />
    </div>
  );
}
