import { useEffect, useState } from "react";
import api, { API_BASE, SUBJECTS, LEVELS, formatINR } from "@/lib/api";
import { Link } from "react-router-dom";
import { Download, Library as LibIcon, ShoppingBag } from "lucide-react";

const subjectMap = Object.fromEntries(SUBJECTS.map((s) => [s.key, s]));
const levelMap = Object.fromEntries(LEVELS.map((l) => [l.key, l]));

export default function MyLibrary() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/me/library").then((r) => setItems(r.data)),
      api.get("/me/orders").then((r) => setOrders(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const downloadOne = async (worksheet_id, title) => {
    try {
      const resp = await api.get(`/me/library/${worksheet_id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      // If admin hasn't uploaded a real PDF yet, surface a friendly message.
      alert("This worksheet's PDF is being prepared. Please check back shortly or contact us.");
    }
  };

  return (
    <div className="container-x section-tight" data-testid="library-page">
      <div className="mb-10">
        <span className="label-tag">Your downloads</span>
        <h1 className="font-heading text-4xl lg:text-5xl text-navy mt-3 leading-tight">My Library</h1>
        <p className="text-muted-foreground mt-3">All your purchased Saksham worksheets — re-download anytime, on any device.</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground" data-testid="library-loading">Loading your worksheets…</div>
      ) : items.length === 0 ? (
        <div className="card-soft p-12 text-center" data-testid="library-empty">
          <LibIcon className="w-12 h-12 text-navy/40 mx-auto mb-4" />
          <h3 className="font-heading text-2xl text-navy mb-2">Your library is empty</h3>
          <p className="text-muted-foreground mb-6">Start browsing — every Saksham worksheet you buy will land here forever.</p>
          <Link to="/shop" className="btn-primary"><ShoppingBag className="w-4 h-4 mr-2" /> Browse worksheets</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="library-grid">
          {items.map((w) => {
            const sub = subjectMap[w.subject];
            const lvl = levelMap[w.level];
            return (
              <div key={w.worksheet_id} className="card-soft overflow-hidden flex flex-col" data-testid={`library-item-${w.worksheet_id}`}>
                <div className="aspect-[4/3] bg-cream relative">
                  {w.cover_image && <img src={w.cover_image} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: sub?.color }}>{sub?.label}</span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className={`badge badge-${w.level}`}>{lvl?.label} {lvl?.stars}</span>
                    <span className="text-muted-foreground">Grade {w.grade}</span>
                  </div>
                  <h3 className="font-heading text-lg text-navy line-clamp-2 mb-4 flex-1">{w.title}</h3>
                  <button onClick={() => downloadOne(w.worksheet_id, w.title)} className="btn-primary w-full !py-2.5 text-sm" data-testid={`download-${w.worksheet_id}`}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl text-navy mb-5">Order history</h2>
          <div className="card-soft overflow-hidden" data-testid="orders-table">
            <table className="w-full text-sm">
              <thead className="bg-cream text-navy text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_id} className="border-t border-border">
                    <td className="px-5 py-3 font-mono text-xs">{o.order_id}</td>
                    <td className="px-5 py-3">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-3">{o.items?.length || 0}</td>
                    <td className="px-5 py-3 font-semibold">{formatINR(o.total_amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${o.status === "paid" ? "badge-easy" : "badge-difficult"}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
