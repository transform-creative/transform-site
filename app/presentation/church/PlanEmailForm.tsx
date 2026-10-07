import { useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { CONTACT } from "~/data/Objects";
import {
  CHURCH_ACTION,
  logChurchActivity,
  type ChurchCtaSource,
} from "~/data/Analytics";
import {
  coordinatorDays,
  hoursBack,
  priceOf,
  type ChurchPlan,
} from "~/business/churchPlanBL";
import { createResponse } from "~/database/Create";
import { LabelInput } from "~/presentation/elements/LabelInput/LabelInput";
import { SlideOutModal } from "~/presentation/elements/SlideOutModal";
import { Icon } from "~/presentation/elements/Icon";
import { fmt } from "./PlanBuilder";
import "../../app-v2.css";

/** `responses.metadata.formId` the email trigger listens for */
export const CHURCH_PLAN_FORM_ID = "church-plan";

const ROLES = [
  "Pastor",
  "Office or admin",
  "Board or treasurer",
  "Other",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  active: boolean;
  plan: ChurchPlan;
  /** Which button opened the form */
  source?: ChurchCtaSource;
  onClose: () => void;
}

/******************************
 * PlanEmailForm component
 * "Email me this plan": saves the lead (with the plan) to `responses`. A
 * database trigger then queues the email with the plan PDF attached.
 */
export function PlanEmailForm({ active, plan, source, onClose }: Props) {
  const context: SharedContextProps = useOutletContext();

  const [name, setName] = useState("");
  const [church, setChurch] = useState("");
  const [role, setRole] = useState<string>();
  const [email, setEmail] = useState("");
  // Honeypot — hidden from people, filled in by bots. The trigger ignores
  // any submission that has it.
  const [website, setWebsite] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const price = priceOf(plan);

  const errors = {
    name: name.trim() ? undefined : "Add your name",
    church: church.trim() ? undefined : "Add your church",
    role: role ? undefined : "Pick your role",
    email: EMAIL_PATTERN.test(email.trim())
      ? undefined
      : "Add a valid email",
  };
  const isValid = !Object.values(errors).some(Boolean);

  async function handleSubmit() {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    setSubmitting(true);
    try {
      await createResponse({
        business_id: 129,
        metadata: {
          formId: CHURCH_PLAN_FORM_ID,
          name: name.trim(),
          church: church.trim(),
          role: role!,
          email: email.trim(),
          website,
          plan,
          lineItems: price.lineItems,
          monthly: price.monthly,
          setup: price.setup,
          annual: price.annual,
          hoursBack: hoursBack(plan),
          coordinator: coordinatorDays(price.monthly),
          submittedAt: new Date().toISOString(),
        },
      });
      logChurchActivity(CHURCH_ACTION.PLAN_PDF_REQUEST, {
        role,
        monthly: price.monthly,
        source,
      });
      context.popAlert(
        "Your plan is on its way",
        `Check ${email.trim()} in a few minutes.`,
      );
      onClose();
    } catch {
      context.popAlert(
        "Something went wrong",
        `Try again, or email ${CONTACT.email}`,
        true,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SlideOutModal
      active={active}
      onClose={onClose}
      context={context}
      isLoading={submitting}
      width={context.inShrink ? "min(350px, 100vw)" : 480}
      title="Email me this plan"
    >
      <div
        className="col gap-10 p-10 scroll-y"
        style={{ maxHeight: "calc(100dvh - 80px)" }}
      >
        <div className="stat-tile col">
          <p className="field-label">Your plan</p>
          <p className="bold">
            {fmt(price.annual)}/yr ex GST
            {price.setup > 0 && ` + ${fmt(price.setup)} setup`}
          </p>
        </div>
        <p>
          We'll email you a one-page PDF you can forward to your board,
          with the answers to the questions they'll ask.
        </p>

        <LabelInput
          name="Your name"
          value={name}
          autoComplete="name"
          error={showErrors ? errors.name : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <LabelInput
          name="Church"
          value={church}
          autoComplete="organization"
          error={showErrors ? errors.church : undefined}
          onChange={(e) => setChurch(e.target.value)}
        />
        <LabelInput
          name="Email"
          type="email"
          value={email}
          autoComplete="email"
          error={showErrors ? errors.email : undefined}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="col gap-5" role="radiogroup" aria-label="Your role">
          <p className="bold mt-5">Your role</p>
          <div className="row gap-5 wrap">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                className={`chip ${role === r ? "active" : ""}`}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
          {showErrors && errors.role && (
            <p className="text-sm danger-text">{errors.role}</p>
          )}
        </div>

        <input
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="accent row middle center gap-5 mt-10"
          disabled={submitting}
          onClick={handleSubmit}
        >
          <Icon name="mail-outline" size={16} color="var(--bkg)" />
          Email me this plan
        </button>
      </div>
    </SlideOutModal>
  );
}
