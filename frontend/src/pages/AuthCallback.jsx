import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { exchangeGoogleSession } = useAuth();
  const nav = useNavigate();
  const ran = useRef(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash;
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      setErr("Missing session id");
      return;
    }
    const session_id = decodeURIComponent(m[1]);
    (async () => {
      try {
        await exchangeGoogleSession(session_id);
        // Clean the URL fragment and go home
        window.history.replaceState(null, "", "/");
        nav("/", { replace: true });
      } catch (e) {
        setErr("Sign-in failed. Please try again.");
      }
    })();
  }, [exchangeGoogleSession, nav]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center" data-testid="auth-callback-page">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-gold" />
        <p className="font-heading text-xl text-navy mt-4">Signing you in…</p>
        {err && <p className="text-red-700 mt-3 text-sm" data-testid="auth-callback-error">{err}</p>}
      </div>
    </div>
  );
}
