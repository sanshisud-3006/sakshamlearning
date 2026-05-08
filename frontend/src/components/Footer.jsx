import { Link } from "react-router-dom";
import { useState } from "react";
import { LOGO_URL } from "@/lib/api";
import api, { formatErr } from "@/lib/api";
import { Mail, Instagram, Youtube, Heart } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.post("/newsletter/subscribe", { email });
      setMsg("✓ You're on the list. Welcome to the Saksham family.");
      setEmail("");
    } catch (err) {
      setMsg(formatErr(err));
    } finally { setBusy(false); }
  };

  return (
    <footer className="bg-navy text-ivory mt-20" data-testid="site-footer">
      <div className="container-x section-tight">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <img src={LOGO_URL} alt="Saksham Learning" className="h-14 w-14 object-contain bg-white rounded-lg p-1" />
              <div>
                <div className="font-heading text-2xl">Saksham</div>
                <div className="text-[11px] tracking-[0.3em] uppercase text-gold-light font-semibold">Learning</div>
              </div>
            </div>
            <p className="font-heading italic text-lg text-ivory/90 leading-relaxed">
              "Every child is capable — of learning at their pace, in their place."
            </p>
            <p className="text-sm text-ivory/70 mt-4 leading-relaxed">
              Curriculum-aligned worksheets crafted by an experienced CBSE educator. KG to Class IX.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-light mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop" className="hover:text-gold-light">Shop Worksheets</Link></li>
              <li><Link to="/how-it-works" className="hover:text-gold-light">How It Works</Link></li>
              <li><Link to="/about" className="hover:text-gold-light">Our Story</Link></li>
              <li><Link to="/blog" className="hover:text-gold-light">Tips & Blog</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-light mb-4">Subjects</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop?subject=english" className="hover:text-gold-light">English</Link></li>
              <li><Link to="/shop?subject=maths" className="hover:text-gold-light">Mathematics</Link></li>
              <li><Link to="/shop?subject=science" className="hover:text-gold-light">Science</Link></li>
              <li><Link to="/shop?subject=sst" className="hover:text-gold-light">SST / EVS</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-light mb-4">Free worksheets, every Sunday</h4>
            <p className="text-sm text-ivory/80 mb-4">Join 5,000+ Indian parents getting free Saksham printables and weekly learning tips — straight to inbox.</p>
            <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2" data-testid="newsletter-form">
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@email.com"
                className="flex-1 bg-ivory/10 border border-ivory/20 rounded-full px-5 py-3 text-ivory placeholder:text-ivory/50 focus:outline-none focus:ring-2 focus:ring-gold"
                data-testid="newsletter-email"
              />
              <button type="submit" disabled={busy} className="btn-primary !py-3" data-testid="newsletter-submit">
                {busy ? "..." : "Join"}
              </button>
            </form>
            {msg && <div className="mt-3 text-sm text-gold-light" data-testid="newsletter-message">{msg}</div>}
          </div>
        </div>

        <div className="gold-line my-10" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-ivory/70">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Saksham Learning</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">Made with <Heart className="w-3.5 h-3.5 text-gold fill-gold" /> in Delhi</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="mailto:info@sakshamlearning.com" className="hover:text-gold-light flex items-center gap-1.5"><Mail className="w-4 h-4" /> info@sakshamlearning.com</a>
            <a href="#" className="hover:text-gold-light"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="hover:text-gold-light"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
