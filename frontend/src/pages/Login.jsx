import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { formatErr, LOGO_URL } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await login(email, password);
      nav(next);
    } catch (e) { setErr(formatErr(e)); }
    finally { setBusy(false); }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const googleLogin = () => {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-5"><img src={LOGO_URL} alt="" className="h-16 w-16 mx-auto" /></Link>
          <h1 className="font-heading text-3xl text-navy">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-2">Sign in to access your worksheets and library.</p>
        </div>

        <div className="card-soft p-7">
          <button onClick={googleLogin} type="button" className="w-full mb-5 flex items-center justify-center gap-2.5 border border-border rounded-full py-3 hover:bg-cream font-medium text-navy transition" data-testid="google-login-btn">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-navy">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field mt-1.5" data-testid="login-email" />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field mt-1.5" data-testid="login-password" />
            </div>
            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="login-error">{err}</div>}
            <button type="submit" disabled={busy} className="btn-primary w-full" data-testid="login-submit">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            New to Saksham? <Link to={`/register${next ? `?next=${next}` : ""}`} className="text-gold font-semibold hover:underline" data-testid="goto-register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
