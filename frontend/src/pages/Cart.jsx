import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatINR, SUBJECTS, LEVELS } from "@/lib/api";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";

const subjectMap = Object.fromEntries(SUBJECTS.map((s) => [s.key, s]));
const levelMap = Object.fromEntries(LEVELS.map((l) => [l.key, l]));

export default function Cart() {
  const { items, remove, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container-x section text-center max-w-xl mx-auto" data-testid="cart-empty">
        <ShoppingBag className="w-14 h-14 text-navy/40 mx-auto mb-6" />
        <h1 className="font-heading text-4xl text-navy mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Find your child's perfect worksheet — by grade, subject, and difficulty.</p>
        <Link to="/shop" className="btn-primary" data-testid="cart-go-shop">Browse worksheets</Link>
      </div>
    );
  }

  const goCheckout = () => {
    if (!user) {
      nav("/login?next=/checkout");
    } else {
      nav("/checkout");
    }
  };

  return (
    <div className="container-x section-tight" data-testid="cart-page">
      <h1 className="font-heading text-4xl lg:text-5xl text-navy mb-10">Your cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-4">
          {items.map((it) => {
            const sub = subjectMap[it.subject];
            const lvl = levelMap[it.level];
            return (
              <div key={it.worksheet_id} className="card-soft p-4 sm:p-5 flex items-center gap-4" data-testid={`cart-item-${it.worksheet_id}`}>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                  {it.cover_image && <img src={it.cover_image} alt={it.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg text-navy leading-tight mb-1.5 line-clamp-2">{it.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {sub && <span className="px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider" style={{ backgroundColor: sub.color }}>{sub.label}</span>}
                    <span className="bg-navy text-ivory px-2 py-0.5 rounded font-bold">Grade {it.grade}</span>
                    {lvl && <span className={`badge badge-${it.level}`}>{lvl.label} {lvl.stars}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-semibold text-xl text-navy">{formatINR(it.price)}</span>
                  <button onClick={() => remove(it.worksheet_id)} className="p-2 hover:bg-difficulty-difficult rounded-full transition" data-testid={`remove-${it.worksheet_id}`} aria-label="Remove">
                    <Trash2 className="w-4 h-4 text-navy" />
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={clear} className="btn-ghost text-sm" data-testid="clear-cart">Clear cart</button>
        </div>

        <div className="lg:col-span-4">
          <div className="card-soft p-6 sticky top-24" data-testid="order-summary">
            <h3 className="font-heading text-xl text-navy mb-5">Order summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{items.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>Included</span></div>
            </div>
            <div className="border-t border-border my-5"></div>
            <div className="flex justify-between font-heading text-2xl text-navy mb-6">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
            <button onClick={goCheckout} className="btn-primary w-full" data-testid="checkout-btn">
              Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Secure payment powered by Razorpay · UPI, cards, netbanking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
