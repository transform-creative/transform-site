import { useOutletContext } from "react-router";
import { SharedContextProps } from "~/data/CommonTypes";
import type { IoniconName } from "~/data/Ionicons";
import { Icon } from "~/presentation/elements/Icon";
import BasicMenu from "~/presentation/elements/BasicMenu";
import type { Feature } from "./FeatureSelector";
import "../../app-v2.css";

interface Props {
  feature: Feature | null;
  index: number | null;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// Solid (non-outline) variant of an icon name, for the accent tile.
const solid = (name: IoniconName) =>
  name.split("-outline")[0] as IoniconName;

export default function FeatureInfo({
  feature,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const context: SharedContextProps = useOutletContext();

  return (
    <BasicMenu
      active={index !== null}
      onClose={onClose}
      disableClickOff={true}
      width={context.inShrink ? "95%" : 560}
      zIndex={120}
    >
      {feature && (
        <div className="col middle center gap-20 fade-sm" >
          <p className="feature-tag m0">{feature.category}</p>
          <div className="feature-icon-tile-lg center middle">
            <Icon name={solid(feature.icon.name)} size={32} color="var(--bkg)" />
          </div>
          <h4 style={{ color: "var(--txt)"}} className="center m0 accent">{feature.text}</h4>
          <div style={{ maxWidth: 460, width: "100%",}}>
            {feature.description.map((para, i) => (
              <p style={{ color: "var(--txt)" }} key={i} className="center mb-10">
                {para}
              </p>
            ))}
          </div>
          {feature.component || null}

          {/* Prev / counter / Next */}
          <div className="horizontal-line" />
          <div className="row between middle w-100">
            <button
              className="row middle gap-5"
              disabled={index === 0}
              style={{ opacity: index === 0 ? 0.3 : 1 }}
              onClick={onPrev}
            >
              <Icon name="arrow-back" size={16} />
              Prev
            </button>
            <small >
              {(index ?? 0) + 1} / {total}
            </small>
            <button
              className="row middle gap-5"
              disabled={index === total - 1}
              style={{ opacity: index === total - 1 ? 0.3 : 1 }}
              onClick={onNext}
            >
              Next
              <Icon name="arrow-forward" size={16} />
            </button>
          </div>
        </div>
      )}
    </BasicMenu>
  );
}
