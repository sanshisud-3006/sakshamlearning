import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { API_BASE, SUBJECTS, LEVELS, formatINR } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Check, Eye, ArrowLeft, Download, ShieldCheck, FileText, Award } from "lucide-react";

const subjectMap = Object.fromEntries(SUBJECTS.map((s) => [s.key, s]));
const levelMap = Object.fromEntries(LEVELS.map((l) => [l.key, l]));

export default function WorksheetDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add, has } = useCart();
  const [w, setW] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/worksheets/${id}`)
      .then((r) => setW(r.data))
      .catch(() => setErr("Worksheet not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container-x section-tight" data-testid="detail-loading">Loading…</div>;
  if (err || !w) return (
    <div className="container-x section-tight text-center" data-testid="detail-error">
      <h1 className="font-heading text-3xl text-navy mb-3">Not found</h1>
      <Link to="/shop" className="btn-primary mt-4">Back to shop</Link>
    </div>
  );

  const sub = subjectMap[w.subject];
  const lvl = levelMap[w.level];
  const inCart = has(w.worksheet_id);

  return (
    <div className="container-x section-tight" data-testid="worksheet-detail-page">
      <Link to="/shop" className="inline-flex items-center gap-2 text-navy hover:text-gold mb-8 text-sm font-medium" data-testid="back-to-shop">
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="relative">
          <div className="absolute -inset-3 bg-cream rounded-3xl rotate-1 -z-10" />
          {w.cover_image ? (
            <img src={w.cover_image} alt={w.title} className="rounded-2xl w-full aspect-[4/5] object-cover shadow-warm" data-testid="detail-cover" />
          ) : (
            <div className="rounded-2xl w-full aspect-[4/5] bg-cream flex items-center justify-center">
              <FileText className="w-24 h-24 text-navy/40" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: sub?.color }}>
              {sub?.label}
            </span>
            <span className="bg-navy text-ivory text-xs font-bold px-3 py-1 rounded-md">Grade {w.grade}</span>
            <span className={`badge badge-${w.level}`}>
              {lvl?.label} <span className="stars">{lvl?.stars}</span>
            </span>
          </div>

          <h1 className="font-heading text-3xl lg:text-5xl text-navy leading-tight mb-5" data-testid="detail-title">{w.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">{w.description}</p>

          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-gold" /> CBSE — NCF-SE 2023 & NEP 2020 aligned</li>
            <li className="flex items-center gap-3"><FileText className="w-5 h-5 text-gold" /> {w.pages} pages · printable PDF</li>
            <li className="flex items-center gap-3"><Award className="w-5 h-5 text-gold" /> Complete answer key included</li>
            <li className="flex items-center gap-3"><Download className="w-5 h-5 text-gold" /> Instant download to your library</li>
          </ul>

          <div className="bg-cream rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Price</div>
                <div className="font-heading text-4xl font-semibold text-navy mt-1">
                  {w.is_free ? "Free" : formatINR(w.price)}
                </div>
              </div>
              {w.has_sample && (
                <a href={`${API_BASE}/worksheets/${w.worksheet_id}/sample`} target="_blank" rel="noreferrer" className="btn-outline !py-2.5 !px-4 text-sm" data-testid="sample-download">
                  <Eye className="w-4 h-4 mr-1" /> Preview sample
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {w.is_free ? (
                <a href={`${API_BASE}/worksheets/${w.worksheet_id}/sample`} target="_blank" rel="noreferrer" className="btn-primary flex-1" data-testid="free-download-btn">
                  <Download className="w-4 h-4 mr-2" /> Download free
                </a>
              ) : (
                <>
                  <button onClick={() => add(w)} disabled={inCart} className="btn-primary flex-1 disabled:opacity-70" data-testid="detail-add-cart">
                    {inCart ? <><Check className="w-4 h-4 mr-2" /> In cart</> : <><ShoppingCart className="w-4 h-4 mr-2" /> Add to cart</>}
                  </button>
                  <button onClick={() => { add(w); nav("/cart"); }} className="btn-secondary flex-1" data-testid="detail-buy-now">
                    Buy now
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-5">Digital download. Add to cart to checkout securely. Once paid, your worksheet appears in <Link to="/library" className="underline">My Library</Link> for unlimited downloads.</p>
        </div>
      </div>
    </div>
  );
}
