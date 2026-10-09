import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import type { FormResponse } from "~/data/CustomTypes";
import { getBusinessResponses } from "~/database/Read";
import {
  flattenResponse,
  formIdOf,
  humaniseKey,
  responsesToCsv,
} from "~/business/surveyBL";
import { downloadFile } from "~/business/radarBL";
import { Icon } from "../elements/Icon";
import "../../app-v2.css";

interface Props {
  businessId: number;
}

/** The respondent's name, when the form captured one */
function nameOf(response: FormResponse): string | null {
  const meta = response.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const name = meta.name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

/******************************
 * Admin viewer for the `responses` table: every form / survey submission for
 * the business, filterable by form, each entry's json split into one line per
 * answer.
 */
export function ResponseViewer({ businessId }: Props) {
  const context: SharedContextProps = useOutletContext();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  // Null shows every form's responses
  const [formFilter, setFormFilter] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBusinessResponses(businessId)
      .then((data) => {
        if (active) setResponses(data);
      })
      .catch(() => {
        if (active)
          context.popAlert(
            "Could not load the responses",
            "Please try again",
            true,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [businessId]);

  // Each form present, with its response count, most responses first
  const forms = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of responses) {
      const id = formIdOf(r);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [responses]);

  const visible = useMemo(
    () =>
      formFilter == null
        ? responses
        : responses.filter((r) => formIdOf(r) === formFilter),
    [responses, formFilter],
  );

  /** Download the responses currently shown (respects the form filter) */
  function exportCsv() {
    downloadFile(
      `responses-${formFilter ?? "all-forms"}-${new Date().toISOString().slice(0, 10)}.csv`,
      responsesToCsv(visible),
    );
  }

  return (
    <div className="col gap-20 w-100">
      <header
        className="col gap-10 p-20 r-10 outline-secondary"
        style={{ background: "var(--accent-sm)" }}
      >
        <div className="row between middle gap-10">
          <h1 className="accent">Responses</h1>
          <button
            className="row middle gap-5 outline-secondary"
            onClick={exportCsv}
            disabled={visible.length === 0}
            title="Export the responses shown to CSV"
          >
            <Icon name="download-outline" color="var(--accent)" />
            Export CSV
          </button>
        </div>
        <p>
          <strong>{responses.length}</strong> form and survey responses
        </p>
      </header>

      {loading ? (
        <p className="center w-100">Loading…</p>
      ) : responses.length === 0 ? (
        <div className="col middle center gap-10 outline p-40">
          <Icon name="document-text-outline" size={48} color="var(--accent)" />
          <h3>No responses yet</h3>
        </div>
      ) : (
        <>
          <nav className="row wrap gap-10 middle">
            {[["all", responses.length] as const, ...forms].map(
              ([id, count]) => {
                const selected =
                  id === "all" ? formFilter == null : formFilter === id;
                return (
                  <button
                    key={id}
                    className={`${selected ? "accentButton" : "outline-secondary"} row gap-5 middle`}
                    onClick={() => setFormFilter(id === "all" ? null : id)}
                  >
                    {id === "all" ? "All forms" : humaniseKey(id)}
                    <b className="badge badge-soft">{count}</b>
                  </button>
                );
              },
            )}
          </nav>

          {visible.map((r) => (
            <article
              key={r.id}
              className="col p-20 r-10 outline-secondary"
            >
              <div className="row between middle gap-10 wrap mb-10">
                <h3>{nameOf(r) ?? `Response #${r.id}`}</h3>
                <div className="row middle gap-10">
                  <p className="badge badge-outline">
                    {humaniseKey(formIdOf(r))}
                  </p>
                  <time className="muted text-sm" dateTime={r.created_at}>
                    {new Date(r.created_at).toLocaleString("en-AU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              </div>
              <dl className="col m0">
                {flattenResponse(r.metadata).map((line, i) => (
                  <div key={i} className="kv-grid list-row">
                    <dt className="muted break-word">
                      {line.path.join(" › ") || "Value"}
                    </dt>
                    <dd className="m0 break-word pre-line">{line.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </>
      )}
    </div>
  );
}
