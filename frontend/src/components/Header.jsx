import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Library } from "lucide-react";
import { LOGO_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop Worksheets" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "Our Story" },
  { to: "/blog", label: "Tips & Blog" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ivory/85 backdrop-blur-md border-b border-border/60" data-testid="site-header">
      <div className="container-x flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          <img src={LOGO_URL} alt="Saksham Learning" className="h-12 w-12 object-contain" />
          <div className="leading-none hidden sm:block">
            <div className="font-heading text-xl font-semibold text-navy tracking-tight">Saksham</div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold font-semibold mt-0.5">Learning</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `link-underline text-sm font-medium tracking-wide ${isActive ? "text-gold" : "text-navy"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative p-2 hover:bg-cream rounded-full transition" data-testid="cart-button">
            <ShoppingCart className="w-5 h-5 text-navy" />
            {items.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                {items.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfile((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-cream transition"
                data-testid="profile-button"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-navy text-ivory flex items-center justify-center text-sm font-semibold">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-navy">{user.name?.split(" ")[0]}</span>
              </button>
              {profile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-border py-2 z-50" data-testid="profile-menu">
                  <Link to="/library" onClick={() => setProfile(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream text-navy" data-testid="menu-library">
                    <Library className="w-4 h-4" /> My Library
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={() => setProfile(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream text-navy" data-testid="menu-admin">
                      <LayoutDashboard className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { setProfile(false); logout(); }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-cream text-navy"
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden sm:inline-flex btn-ghost" data-testid="login-link">
              <User className="w-4 h-4 mr-1" /> Sign in
            </Link>
          )}

          <button onClick={() => setOpen((o) => !o)} className="lg:hidden p-2 rounded-full hover:bg-cream" data-testid="mobile-menu-toggle">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-ivory" data-testid="mobile-menu">
          <div className="container-x py-4 flex flex-col gap-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-base font-medium py-2 ${isActive ? "text-gold" : "text-navy"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {!user && (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary w-full mt-2">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
