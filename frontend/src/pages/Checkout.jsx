import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatErr, formatINR } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) nav("/login?next=/checkout");
  }, [user, nav]);

  useEffect(() => {
    if (items.length === 0) nav("/cart");
  }, [items, nav]);

  const placeOrder = async () => {
    setBusy(true); setErr("");
    try {
      const { data } = await api.post("/orders/create", {
        items: items.map((i) => ({ worksheet_id: i.worksheet_id, quantity: 1 })),
      });
      const orderId = data.order.order_id;

      if (data.is_mock) {
        // Simulate Razorpay flow (test mode placeholder)
        const ok = await new Promise((res) => setTimeout(() => res(true), 1200));
        if (ok) {
          await api.post("/orders/verify", { order_id: orderId, mock: true });
          clear();
          nav(`/order-success?order_id=${orderId}`);
        }
      } else {
        // Real Razorpay flow
        await loadRazorpay();
        const opts = {
          key: data.razorpay_key_id,
          amount: data.order.total_amount * 100,
          currency: "INR",
          name: "Saksham Learning",
          description: `${items.length} worksheet${items.length > 1 ? "s" : ""}`,
          order_id: data.order.razorpay_order_id,
          handler: async (resp) => {
            try {
              await api.post("/orders/verify", {
                order_id: orderId,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
              });
              clear();
              nav(`/order-success?order_id=${orderId}`);
            } catch (e) { setErr(formatErr(e)); }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#1B3A6B" },
        };
        const rzp = new window.Razorpay(opts);
        rzp.open();
      }
    } catch (e) {
      setErr(formatErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x section-tight" data-testid="checkout-page">
      <h1 className="font-heading text-4xl lg:text-5xl text-navy mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="card-soft p-6">
            <h3 className="font-heading text-xl text-navy mb-4">Account</h3>
            <p className="text-sm text-muted-foreground">Logged in as <span className="font-medium text-navy">{user?.email}</span></p>
            <p className="text-xs text-muted-foreground mt-2">Your worksheets will be added to <span className="underline">My Library</span> instantly after payment.</p>
          </div>

          <div className="card-soft p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-gold" />
              <h3 className="font-heading text-xl text-navy">Payment</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Secure payment via Razorpay. UPI · Cards · Netbanking · Wallets.
            </p>
            <button onClick={placeOrder} disabled={busy} className="btn-primary w-full !py-4" data-testid="pay-now-btn">
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : <><Lock className="w-4 h-4 mr-2" /> Pay {formatINR(total)} securely</>}
            </button>
            {err && <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="checkout-error">{err}</div>}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="card-soft p-6 sticky top-24" data-testid="checkout-summary">
            <h3 className="font-heading text-xl text-navy mb-5">Your order</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {items.map((it) => (
                <div key={it.worksheet_id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                    {it.cover_image && <img src={it.cover_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-navy font-medium line-clamp-1">{it.title}</div>
                    <div className="text-xs text-muted-foreground">Grade {it.grade} · {it.level}</div>
                  </div>
                  <span className="text-sm font-semibold text-navy">{formatINR(it.price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border my-5"></div>
            <div className="flex justify-between font-heading text-2xl text-navy">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay SDK failed to load"));
    document.body.appendChild(s);
  });
}
