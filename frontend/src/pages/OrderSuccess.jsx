import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Library, ShoppingBag } from "lucide-react";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  return (
    <div className="container-x section text-center max-w-2xl mx-auto" data-testid="order-success-page">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-difficulty-easy mb-7">
        <CheckCircle2 className="w-12 h-12 text-green-700" />
      </div>
      <h1 className="font-heading text-4xl lg:text-5xl text-navy leading-tight mb-4">Thank you — payment received!</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Your worksheets are ready in your Library. Print, practice, and watch confidence grow — one step at a time.
      </p>
      {orderId && <p className="text-xs text-muted-foreground mb-10" data-testid="order-id-display">Order ID: <span className="font-mono">{orderId}</span></p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/library" className="btn-primary" data-testid="goto-library-btn"><Library className="w-4 h-4 mr-2" /> Go to My Library</Link>
        <Link to="/shop" className="btn-outline" data-testid="continue-shopping-btn"><ShoppingBag className="w-4 h-4 mr-2" /> Keep browsing</Link>
      </div>
    </div>
  );
}
