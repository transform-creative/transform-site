import { useState, useRef, useEffect, useMemo, ReactElement } from "react";
import { Icon } from "~/presentation/elements/Icon";
import type { IoniconName } from "~/data/Ionicons";
import gsap from "gsap";
import FeatureInfo from "./FeatureInfo";
import "../../app-v2.css";

export interface Feature {
  className?: string;
  icon: { name: IoniconName; size: number };
  text: string;
  description: string[];
  category: string;
  component?: ReactElement;
}

interface Props {
  features: Feature[];
}

export default function FeatureSelector({ features }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const pillsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Unique categories in source order, each with its count.
  const categories = useMemo(() => {
    const seen = new Map<string, number>();
    for (const f of features)
      seen.set(f.category, (seen.get(f.category) ?? 0) + 1);
    return Array.from(seen, ([label, count]) => ({ label, count }));
  }, [features]);

  // Features matching the active category + search term.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((f) => {
      if (activeCategory && f.category !== activeCategory) return false;
      if (!q) return true;
      return (
        f.text.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [features, activeCategory, search]);

  const selected = openIndex !== null ? filtered[openIndex] : null;

  // Stagger the category pills in when they scroll into view.
  // useEffect(() => {
  //   const container = pillsRef.current;
  //   if (!container) return;
  //   const pills = container.querySelectorAll("button");
  //   if (!pills.length) return;
  //   gsap.set(pills, { opacity: 0, y: -10 });
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       if (entries[0].isIntersecting) {
  //         gsap.to(pills, {
  //           opacity: 1,
  //           y: 0,
  //           stagger: 0.06,
  //           ease: "power3",
  //           duration: 0.5,
  //         });
  //         observer.disconnect();
  //       }
  //     },
  //     { threshold: 0.1 },
  //   );
  //   observer.observe(container);
  //   return () => observer.disconnect();
  // }, []);

  // // Re-animate the cards whenever the filtered set changes.
  // useEffect(() => {
  //   const grid = gridRef.current;
  //   if (!grid) return;
  //   gsap.from(grid.children, {
  //     opacity: 0,
  //     y: 12,
  //     stagger: 0.05,
  //     ease: "power3",
  //     duration: 0.4,
  //   });
  // }, [activeCategory, search]);

  return (
    <div className="col gap-20 w-100">
      {/* Search bar */}
      <div className="row center w-100">
        <div
          className="feature-search row middle gap-10"
          style={{ maxWidth: 480, width: "100%" }}
        >
          <Icon name="search-outline" size={18} color="var(--bkg)" />
          <input
            className="feature-search-input"
            type="text"
            value={search}
            placeholder="Search features…"
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenIndex(null);
            }}
          />
          {search && (
            <Icon
              name="close-circle"
              size={18}
              color="var(--bkg)"
              className="clickable"
              onClick={() => setSearch("")}
            />
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="row center wrap gap-10" ref={pillsRef}>
        <CategoryPill
          label="All"
          count={features.length}
          active={activeCategory === null}
          onClick={() => {
            setActiveCategory(null);
            setOpenIndex(null);
          }}
        />
        {categories.map((c) => (
          <CategoryPill
            key={c.label}
            label={c.label}
            count={c.count}
            active={activeCategory === c.label}
            onClick={() => {
              setActiveCategory(c.label);
              setOpenIndex(null);
            }}
          />
        ))}
      </div>

      {/* Card grid */}
      {filtered.length ? (
        <div className="grid-250" ref={gridRef}>
          {filtered.map((feature, index) => (
            <div
              key={feature.text}
              role="button"
              tabIndex={0}
              className="feature-card col gap-10 p-20"
              onClick={() => setOpenIndex(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpenIndex(index);
              }}
            >
              <div className="feature-icon-tile center middle">
                <Icon
                  name={feature.icon.name}
                  size={22}
                  color="var(--bkg)"
                />
              </div>
              <b>{feature.text}</b>
              <p className="feature-clamp m0">{feature.description[0]}</p>
              <div className="row middle gap-5 feature-more">
                More
                <Icon name="arrow-forward" size={14} color="var(--bkg)" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="center w-100">No features match your search.</p>
      )}

      {/* Description popout */}
      <FeatureInfo
        feature={selected}
        index={openIndex}
        total={filtered.length}
        onClose={() => setOpenIndex(null)}
        onPrev={() => setOpenIndex((i) => (i !== null ? i - 1 : i))}
        onNext={() => setOpenIndex((i) => (i !== null ? i + 1 : i))}
      />
    </div>
  );
}

interface CategoryPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function CategoryPill({ label, count, active, onClick }: CategoryPillProps) {
  return (
    <button
      className={`feature-pill row middle gap-5 ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
      <b className="pill-count">{count}</b>
    </button>
  );
}
