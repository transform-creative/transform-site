import { useOutletContext, useParams } from "react-router";
import { Route } from "../+types/root";
import { Icon } from "~/presentation/elements/Icon";
import { LabelInput } from "~/presentation/elements/LabelInput/LabelInput";
import { useState } from "react";
import { PillToggle } from "~/presentation/elements/PillToggle";
import BasicMenu from "~/presentation/elements/BasicMenu";
import { createResponse } from "~/database/Create";
import type { SharedContextProps } from "~/data/CommonTypes";
import "../app-v2.css";

export function meta({}: Route.MetaArgs) {
  return [{ title: "" }, { name: "description", content: "" }];
}

export default function FormRoute() {
  const formId = useParams().id;
  const context: SharedContextProps = useOutletContext();

  const [formFor, setFormFor] = useState<string>("child");
  const [name, setName] = useState<string>();
  const [dietaryRequirements, setDietaryRequirements] =
    useState<string>();
  const [confirmed, setConfirmed] = useState(false);
  const [over18, setOver18] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!(over18 && confirmed && (name || "").length > 3)) return;

    setSubmitting(true);
    try {
      await createResponse({
        business_id: 129,
        metadata: {
          formId,
          formFor,
          name,
          dietaryRequirements,
          confirmed,
          over18,
        },
      });
      setSubmitted(true);
      setFormFor("child");
      setName("");
      setDietaryRequirements("");
      setConfirmed(false);
      setOver18(false);
    } catch (e: any) {
      context.popAlert(
        "Something went wrong",
        e?.message || "Please try again in a moment",
        true
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (formId === "ys-extra-sign-up")
    return (
      <div className="col middle center">
         <div className="row w-100 center middle gap-20 mt-20 mb-20">
          <img
            style={{ height: 80 }}
            src="/transform-icon-color-donut.png"
          />
          <img
            style={{ height: 80 }}
            src="https://static.wixstatic.com/media/fe06df_71222cb0318d442db2d83cbe634ce91b~mv2.png/v1/fill/w_160,h_91,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Converge%20Oceania%20Logo%20(rev).png"
          />
        </div>
        <div className="col gap-10 middle w-75 ">
          <h2 className="textCenter ml-20 mr-20">
            Become an extra on 'Your Story'
          </h2>
        
          <div className="textCenter p-10 col gap-10 w-75 ">
            <p className=" ml-20 mr-20">
              'Your Story' is a 6 part video training series featuring
              interviews and stories adapted from the{" "}
              <a
                href="https://drive.google.com/file/d/1AlgAvcKdyGK17f_fMw_5SP7KZCTJvtPD/view?usp=sharing"
                target="_blank"
                rel="no-refferer"
                style={{ color: "var(--accent)" }}
              >
                Your story research report
              </a>
              .
            </p>
            <p className=" ml-20 mr-20">
              We need 20 young people to help us bring a school scene
              to life! Would you join us?
            </p>
          </div>
        </div>

       
 <div className="p-10 gap-10 row middle">
            <Icon name="pizza" color="var(--accent)" size={22} />
            <h3 style={{color: 'var(--accent)'}}>Free pizza lunch provided</h3>
          </div>
        <div className="w-75 mb-20">
          <div className="row gap-20 shrink-col m-20 ">
            <div className="col w-50 shrink-hide">
              <img src="https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/compressed_tc_crew_2.jpg" />
            </div>

            <div className="col w-50 gap-10">
              <div className="col  gap-10">
                <h5 style={{color: "var(--txt)"}}>Key details</h5>
                <div className="boxed accent p-10 gap-10 row middle">
                  <Icon name="calendar" size={22} />
                  <h3>July 15, 9am - 12pm</h3>
                </div>
                <div className="boxed outline-secondary p-10 gap-10 row middle">
                  <Icon name="location" size={22} />
                  <h3>King's Baptist Grammar school</h3>
                </div>

                <div className="boxed outline-secondary p-10 gap-10 row middle">
                  <Icon name="shirt" size={22} />
                  <h3>Sensible school casual clothes</h3>
                </div>
                 

                <div className="boxed outline-accent p-10 h-100 col gap-10">
                  <div>
                    <label className="" style={{ fontWeight: 600 }}>
                      I'm signing up for
                    </label>
                    <PillToggle
                      className="mt-10"
                      value={formFor || ""}
                      onChange={(e) => setFormFor(e)}
                      options={[
                        { value: "child", label: "My child" },
                        { value: "self", label: "My self" },
                      ]}
                    />
                  </div>
                  <LabelInput
                    name="Name"
                    placeholder="John Smith"
                    autoComplete="name"
                    style={{ height: "1.1rem" }}
                    value={name || ""}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <LabelInput
                    name="Dietary Requirements"
                    autoComplete="Dietary Requirements"
                    value={dietaryRequirements || ""}
                    style={{ height: "1.1rem" }}
                    placeholder="None"
                    onChange={(e) =>
                      setDietaryRequirements(e.target.value)
                    }
                  />
                  <div className="row gap-10 mt-20 middle">
                    <input
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      type="checkbox"
                      className="outline"
                      style={{ height: 20, width: 20 }}
                    />
                    <p
                      className="clickable"
                      style={{textAlign: "start"}}
                      onClick={() => setConfirmed(!confirmed)}
                    >
                      I acknowledge the <b>9am start time</b>,{" "}
                      <b>clothing requirements</b>, and that{" "}
                      <b>food will be served</b>
                    </p>
                  </div>
                  <div className="row gap-10 middle">
                    <input
                      checked={over18}
                      onChange={(e) => setOver18(e.target.checked)}
                      type="checkbox"
                      className="outline"
                      style={{ height: 20, width: 20 }}
                    />
                    <p
                      className="clickable"
                      onClick={() => setOver18(!over18)}
                    >
                      I am over 18
                    </p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !(
                        over18 &&
                        confirmed &&
                        (name || "").length > 3
                      )
                    }
                    className="accent w-100 mt-10 row middle center gap-5"
                  >
                    Sign {formFor === "child" ? "my child" : "me"} up
                    <Icon name="arrow-forward" size={18} />
                  </button>
                  <a
                    role="button"
                    className="outline-secondary w-100 row middle center gap-10"
                    style={{
                      background: "none",
                      color: "var(--txt)",
                    }}
                    href="mailto:hello@transformcreative.com.au?subject=Your Story filming"
                  >
                    <Icon name="mail-open" size={18} /> hello@transformcreative.com.au
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BasicMenu
          active={submitted}
          onClose={() => setSubmitted(false)}
          width={400}
          icon={{
            name: "checkmark-circle",
            color: "var(--accent)",
            size: 60,
          }}
        >
          <div className="col middle center gap-10 textCenter p-10">
            <h2>Thanks!</h2>
            <p>
              You're all signed up. We'll be in touch with anything else
              you need to know before the day.
            </p>
          </div>
        </BasicMenu>
      </div>
    );
}
