import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { DecisionReason, OrgDecision, OrgOwner, OrgStatus } from "~/data/CustomTypes";
import { createOrgDecisions } from "~/database/Create";
import {
  REASONS,
  REASON_META,
  SNOOZE_OPTIONS,
  STATUSES,
  STATUS_META,
  buildDecision,
  decisionLabel,
  fmtDate,
  needsReason,
  segmentOf,
  snoozeUntil,
  type SnoozeOption,
} from "~/business/radarBL";
import BasicMenu from "../elements/BasicMenu";
import { Icon } from "../elements/Icon";
import { OwnerTags } from "./OwnerTags";
import "../../app-v2.css";

/** The org being decided on (a radar row, or any org from search) */
export interface DecideTarget {
  abn: string;
  name: string | null;
  segment?: string | null;
  revenue_total?: number | null;
  fy_end_month?: number | null;
}

interface FormProps {
  target: DecideTarget;
  /** Its status right now, so it isn't offered again */
  status: OrgStatus;
  /** The latest snapshot month (the baseline for waking) */
  month: string | null;
  onSaved: (rows: OrgDecision[]) => void;
}

/******************************
 * The two-second triage: status, reason, (snooze length), optional note, save.
 */
export function DecisionForm({ target, status, month, onSaved }: FormProps) {
  const context: SharedContextProps = useOutletContext();
  const [next, setNext] = useState<OrgStatus | null>(null);
  const [reason, setReason] = useState<DecisionReason | null>(null);
  const [snooze, setSnooze] = useState<SnoozeOption | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const reasonNeeded = !!next && needsReason(next);
  const valid = !!next && (!reasonNeeded || !!reason) && (next !== "snoozed" || snooze != null);
  const snoozeOptions = SNOOZE_OPTIONS.filter((o) => o.value !== "budget" || target.fy_end_month);

  async function save() {
    if (!valid || !next) return;
    setSaving(true);
    try {
      const rows = await createOrgDecisions([
        buildDecision(target, next, {
          reason: reasonNeeded ? reason : null,
          note,
          snooze_until: snooze != null ? snoozeUntil(snooze, target.fy_end_month ?? null) : null,
          month,
        }),
      ]);
      context.popAlert(decisionLabel(rows[0]), target.name ?? undefined);
      onSaved(rows);
    } catch {
      context.popAlert("Could not save the decision", "Please try again", true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="col gap-10">
      <fieldset className="col gap-5 m0 p0" style={{ border: "none" }}>
        <legend className="field-label">Status</legend>
        <div className="row wrap gap-5">
          {STATUSES.filter((s) => s !== status).map((s) => (
            <button
              key={s}
              type="button"
              className={`chip row middle gap-5 ${next === s ? "active" : ""}`}
              aria-pressed={next === s}
              onClick={() => setNext(s)}
              title={STATUS_META[s].blurb}
            >
              <Icon name={STATUS_META[s].icon} size={14} color={next === s ? "var(--bkg)" : "var(--accent)"} />
              {s === "new" ? "Back to inbox" : STATUS_META[s].label}
            </button>
          ))}
        </div>
        {next && <small className="text-sm muted">{STATUS_META[next].blurb}</small>}
      </fieldset>

      {reasonNeeded && (
        <fieldset className="col gap-5 m0 p0" style={{ border: "none" }}>
          <legend className="field-label">Reason</legend>
          <div className="row wrap gap-5">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`chip ${reason === r ? "active" : ""}`}
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
              >
                {REASON_META[r]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {next === "snoozed" && (
        <fieldset className="col gap-5 m0 p0" style={{ border: "none" }}>
          <legend className="field-label">Snooze for</legend>
          <div className="row wrap gap-5">
            {snoozeOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${snooze === o.value ? "active" : ""}`}
                aria-pressed={snooze === o.value}
                onClick={() => setSnooze(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {snooze != null && (
            <small className="text-sm muted">
              Back on {fmtDate(snoozeUntil(snooze, target.fy_end_month ?? null))}, or sooner if a new signal fires.
            </small>
          )}
        </fieldset>
      )}

      {next && (
        <label className="col gap-5">
          <p className="field-label">Note (optional)</p>
          <input
            className="text-sm"
            value={note}
            maxLength={200}
            placeholder="One line future you will thank you for"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </label>
      )}

      <button className="accentButton text-sm" disabled={!valid || saving} onClick={save}>
        {saving ? "Saving…" : "Save decision"}
      </button>
    </div>
  );
}

interface MenuProps {
  target: DecideTarget | null;
  status: OrgStatus;
  /** The org's manual Jenny / Phil tag, if any */
  owner: OrgOwner | undefined;
  month: string | null;
  onClose: () => void;
  onSaved: (rows: OrgDecision[]) => void;
  onOwnerChange: (abn: string, owner: OrgOwner | null) => void;
}

/******************************
 * DecisionForm in a bottom menu, for deciding straight from the list.
 */
export function DecideMenu({ target, status, owner, month, onClose, onSaved, onOwnerChange }: MenuProps) {
  const context: SharedContextProps = useOutletContext();
  return (
    <BasicMenu active={!!target} onClose={onClose} width={context.inShrink ? "95%" : 560}>
      {target && (
        <div className="col gap-10">
          <h3>{target.name}</h3>
          <OwnerTags
            abn={target.abn}
            name={target.name}
            autoSegment={segmentOf({ segment: target.segment ?? null })}
            owner={owner}
            onChange={onOwnerChange}
          />
          <DecisionForm
            key={target.abn}
            target={target}
            status={status}
            month={month}
            onSaved={(rows) => {
              onSaved(rows);
              onClose();
            }}
          />
        </div>
      )}
    </BasicMenu>
  );
}
