import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { OrgOwner, OrgSegment } from "~/data/CustomTypes";
import { upsertOrgOwner } from "~/database/Update";
import { deleteOrgOwner } from "~/database/Delete";
import { OWNERS, SEGMENT_META, effectiveSegment, ownersOf, type Owner } from "~/business/radarBL";
import { Icon } from "../elements/Icon";
import "../../app-v2.css";

interface Props {
  abn: string;
  name: string | null;
  /** The automatic segment from the radar data (null = doesn't fit) */
  autoSegment: OrgSegment | null;
  /** The manual tag, if one is set */
  owner: OrgOwner | undefined;
  /** Saved tag, or null when reset to auto */
  onChange: (abn: string, owner: OrgOwner | null) => void;
}

/******************************
 * Jenny / Phil toggles. Setting either pins the org by hand over the automatic
 * segment; "Reset to auto" hands it back to the classification.
 */
export function OwnerTags({ abn, name, autoSegment, owner, onChange }: Props) {
  const context: SharedContextProps = useOutletContext();
  const [saving, setSaving] = useState(false);
  const current = ownersOf(effectiveSegment({ segment: autoSegment }, owner));

  async function toggle(who: Owner) {
    const next = { ...current, [who]: !current[who] };
    if (!next.jenny && !next.phil) {
      context.popAlert("Keep at least one", "Or reset to the automatic segment", true);
      return;
    }
    setSaving(true);
    try {
      onChange(abn, await upsertOrgOwner({ abn, name, jenny: next.jenny, phil: next.phil }));
    } catch {
      context.popAlert("Could not save the tag", "Please try again", true);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    try {
      await deleteOrgOwner(abn);
      onChange(abn, null);
    } catch {
      context.popAlert("Could not reset the tag", "Please try again", true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="row wrap middle gap-5">
      <p className="field-label">Who</p>
      {OWNERS.map((who) => (
        <button
          key={who}
          type="button"
          className={`chip row middle gap-5 ${current[who] ? "active" : ""}`}
          aria-pressed={current[who]}
          disabled={saving}
          onClick={() => toggle(who)}
          title={SEGMENT_META[who].blurb}
        >
          <Icon name={current[who] ? "checkmark-outline" : "add-outline"} size={14} color={current[who] ? "var(--bkg)" : "var(--accent)"} />
          {SEGMENT_META[who].label}
        </button>
      ))}
      {owner ? (
        <>
          <small className="text-sm muted">Set by hand</small>
          <button className="text-button text-sm accent-text" disabled={saving} onClick={reset}>
            Reset to auto{autoSegment ? ` (${SEGMENT_META[autoSegment].label})` : ""}
          </button>
        </>
      ) : (
        <small className="text-sm muted">Auto</small>
      )}
    </div>
  );
}
