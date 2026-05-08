import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import WorksheetDetail from "@/pages/WorksheetDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import MyLibrary from "@/pages/MyLibrary";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthCallback from "@/pages/AuthCallback";
import About from "@/pages/About";
import HowItWorks from "@/pages/HowItWorks";
import { BlogIndex, BlogDetail } from "@/pages/Blog";
import Admin from "@/pages/Admin";
import "@/App.css";

function HashAuthGate({ children }) {
  // If returning from Google OAuth callback, send to /auth/callback page
  const loc = useLocation();
  if (loc.hash?.includes("session_id=") && !loc.pathname.startsWith("/auth/callback")) {
    return <Navigate to={"/auth/callback" + loc.hash} replace />;
  }
  return children;
}

function Layout({ children, hideChrome }) {
  if (hideChrome) return <>{children}</>;
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

function Shell() {
  const loc = useLocation();
  const hideChrome = loc.pathname.startsWith("/admin");
  return (
    <HashAuthGate>
      <Layout hideChrome={hideChrome}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/worksheets/:id" element={<WorksheetDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><MyLibrary /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/admin/*" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashAuthGate>
  );
}

function NotFound() {
  return (
    <div className="container-x section text-center" data-testid="not-found-page">
      <span className="label-tag">404</span>
      <h1 className="font-heading text-5xl text-navy mt-3">Page not found</h1>
      <a href="/" className="btn-primary mt-8 inline-flex">Back home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Shell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
