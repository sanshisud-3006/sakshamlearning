import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { SUBJECTS, GRADES, LEVELS } from "@/lib/api";
import WorksheetCard from "@/components/WorksheetCard";
import { Search, X, SlidersHorizontal } from "lucide-react";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const subject = params.get("subject") || "";
  const grade = params.get("grade") || "";
  const level = params.get("level") || "";
  const search = params.get("q") || "";
  const free = params.get("free") === "1";

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (subject) q.set("subject", subject);
    if (grade) q.set("grade", grade);
    if (level) q.set("level", level);
    if (search) q.set("search", search);
    if (free) q.set("is_free", "true");
    q.set("limit", "120");
    api.get(`/worksheets?${q.toString()}`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, [subject, grade, level, search, free]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams({}, { replace: true });

  const Filters = (
    <div className="space-y-7" data-testid="filters-panel">
      <div>
        <h4 className="label-tag mb-3">Grade</h4>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => setParam("grade", grade === g ? "" : g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${grade === g ? "bg-navy text-ivory border-navy" : "bg-white border-border text-navy hover:border-navy"}`}
              data-testid={`filter-grade-${g}`}
            >
              {g === "KG" ? "KG" : `Grade ${g}`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="label-tag mb-3">Subject</h4>
        <div className="flex flex-col gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setParam("subject", subject === s.key ? "" : s.key)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium border transition text-left ${subject === s.key ? "border-navy bg-cream" : "border-border bg-white hover:border-navy"}`}
              data-testid={`filter-subject-${s.key}`}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="label-tag mb-3">Difficulty</h4>
        <div className="flex flex-col gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              onClick={() => setParam("level", level === l.key ? "" : l.key)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium border transition ${level === l.key ? "border-navy bg-cream" : "border-border bg-white hover:border-navy"}`}
              data-testid={`filter-level-${l.key}`}
            >
              <span>{l.label}</span>
              <span className="stars text-base">{l.stars}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setParam("free", free ? "" : "1")}
        className={`w-full px-3 py-2 rounded-lg text-sm font-semibold border transition ${free ? "bg-gold text-white border-gold" : "border-border bg-white text-navy hover:border-gold"}`}
        data-testid="filter-free"
      >
        {free ? "✓ Showing free samples" : "Show free samples only"}
      </button>

      <button onClick={clearAll} className="btn-ghost w-full" data-testid="clear-filters">
        <X className="w-4 h-4 mr-1" /> Clear all filters
      </button>
    </div>
  );

  return (
    <div className="container-x section-tight" data-testid="shop-page">
      <div className="mb-10 max-w-3xl">
        <span className="label-tag">Shop worksheets</span>
        <h1 className="font-heading text-4xl lg:text-5xl text-navy mt-3 leading-tight">
          The right worksheet, at the right level — every time.
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Filter by grade, subject and difficulty. Each topic comes in three levels — start where your child is.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search worksheets..."
            value={search}
            onChange={(e) => setParam("q", e.target.value)}
            className="input-field !pl-12 !py-4 !rounded-full"
            data-testid="search-input"
          />
        </div>
        <button onClick={() => setShowFilters(true)} className="btn-outline lg:hidden !py-3 !px-5" data-testid="open-filters-mobile">
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="hidden lg:block lg:col-span-3">{Filters}</aside>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="shop-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-soft animate-pulse aspect-[3/4] bg-cream" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20" data-testid="shop-empty">
              <p className="font-heading text-2xl text-navy mb-2">No worksheets match those filters.</p>
              <p className="text-muted-foreground mb-6">Try clearing some filters to see more.</p>
              <button onClick={clearAll} className="btn-primary">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4" data-testid="shop-count">
                {items.length} worksheet{items.length !== 1 ? "s" : ""} found
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((w) => <WorksheetCard key={w.worksheet_id} w={w} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-filters-drawer">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-ivory p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-2xl text-navy">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-cream rounded-full"><X className="w-5 h-5" /></button>
            </div>
            {Filters}
          </div>
        </div>
      )}
    </div>
  );
}
