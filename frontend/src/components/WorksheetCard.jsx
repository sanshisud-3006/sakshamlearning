import { Link } from "react-router-dom";
import { ShoppingCart, Check, Eye } from "lucide-react";
import { useCart } from "@/lib/cart";
import { SUBJECTS, LEVELS, formatINR } from "@/lib/api";

const subjectMap = Object.fromEntries(SUBJECTS.map((s) => [s.key, s]));
const levelMap = Object.fromEntries(LEVELS.map((l) => [l.key, l]));

export default function WorksheetCard({ w }) {
  const { add, has } = useCart();
  const sub = subjectMap[w.subject];
  const lvl = levelMap[w.level];
  const inCart = has(w.worksheet_id);

  return (
    <div className="card-soft overflow-hidden flex flex-col h-full group" data-testid={`worksheet-card-${w.worksheet_id}`}>
      <Link to={`/worksheets/${w.worksheet_id}`} className="block relative aspect-[4/3] overflow-hidden bg-cream">
        {w.cover_image && (
          <img src={w.cover_image} alt={w.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow" style={{ backgroundColor: sub?.color }}>
            {sub?.label}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-navy text-ivory text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide">
            Grade {w.grade}
          </span>
        </div>
        {w.is_free && (
          <div className="absolute bottom-3 left-3 bg-gold text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
            Free Sample
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`badge badge-${w.level}`} data-testid={`level-badge-${w.level}`}>
            {lvl?.label} <span className="stars">{lvl?.stars}</span>
          </span>
          <span className="text-xs text-muted-foreground">{w.pages} pages</span>
        </div>

        <Link to={`/worksheets/${w.worksheet_id}`} className="font-heading text-lg leading-snug text-navy hover:text-gold transition mb-2 line-clamp-2 min-h-[3.25rem]">
          {w.title}
        </Link>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{w.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="font-heading text-2xl font-semibold text-navy">
            {w.is_free ? "Free" : formatINR(w.price)}
          </div>
          {w.is_free ? (
            <Link to={`/worksheets/${w.worksheet_id}`} className="btn-outline !px-4 !py-2.5 text-sm" data-testid={`view-${w.worksheet_id}`}>
              <Eye className="w-4 h-4 mr-1" /> View
            </Link>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); add(w); }}
              disabled={inCart}
              className="btn-primary !px-4 !py-2.5 text-sm disabled:opacity-70"
              data-testid={`add-to-cart-${w.worksheet_id}`}
            >
              {inCart ? <><Check className="w-4 h-4 mr-1" /> Added</> : <><ShoppingCart className="w-4 h-4 mr-1" /> Add</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
