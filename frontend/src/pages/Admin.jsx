import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import api, { API_BASE, formatErr, formatINR, GRADES, SUBJECTS, LEVELS, LOGO_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, FileText, ShoppingCart, Users, Mail, MessageSquareQuote, Pen, Plus, Trash2, X, Loader2, ArrowLeft, ExternalLink } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/worksheets", label: "Worksheets", icon: FileText },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/blog", label: "Blog", icon: Pen },
];

export default function Admin() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-cream/50" data-testid="admin-layout">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="bg-navy text-ivory min-h-screen p-6 hidden lg:block sticky top-0">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <img src={LOGO_URL} alt="" className="h-10 w-10 bg-white rounded-md p-1" />
            <div>
              <div className="font-heading text-lg leading-none">Saksham</div>
              <div className="text-[10px] tracking-widest text-gold-light uppercase mt-1">Admin</div>
            </div>
          </Link>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? "bg-gold text-white" : "text-ivory/80 hover:bg-ivory/10"}`
                }
                data-testid={`admin-nav-${n.label.toLowerCase()}`}
              >
                <n.icon className="w-4 h-4" /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-10 pt-6 border-t border-ivory/10">
            <Link to="/" className="text-sm text-ivory/70 hover:text-gold-light flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to site</Link>
            <div className="mt-4 text-xs text-ivory/60">Signed in as<br /><span className="text-ivory">{user?.email}</span></div>
            <button onClick={logout} className="mt-3 text-xs text-gold-light hover:underline" data-testid="admin-logout">Sign out</button>
          </div>
        </aside>

        <main className="p-6 lg:p-10">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="worksheets" element={<Worksheets />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={<UsersList />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="blog" element={<Blog />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);
  const tiles = [
    { label: "Revenue (paid)", value: stats ? formatINR(stats.revenue) : "—", color: "bg-difficulty-easy text-green-900" },
    { label: "Paid orders", value: stats?.total_orders ?? "—", color: "bg-difficulty-moderate text-yellow-900" },
    { label: "Worksheets", value: stats?.total_worksheets ?? "—", color: "bg-difficulty-difficult text-orange-900" },
    { label: "Customers", value: stats?.total_users ?? "—", color: "bg-cream text-navy" },
    { label: "Newsletter subs", value: stats?.newsletter_subscribers ?? "—", color: "bg-navy text-ivory" },
  ];
  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-heading text-3xl text-navy mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Quick overview of your store.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-2xl p-6 ${t.color}`} data-testid={`stat-${t.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{t.label}</div>
            <div className="font-heading text-3xl mt-3">{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Worksheets() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const refresh = () => api.get("/admin/worksheets").then((r) => setItems(r.data));
  useEffect(() => { refresh(); }, []);

  const onCreate = async (form) => {
    setBusy(true); setErr("");
    try {
      const fd = new FormData();
      Object.entries(form.fields).forEach(([k, v]) => fd.append(k, String(v)));
      if (form.pdf) fd.append("pdf", form.pdf);
      if (form.sample) fd.append("sample_pdf", form.sample);
      await api.post("/admin/worksheets", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowForm(false);
      await refresh();
    } catch (e) { setErr(formatErr(e)); }
    finally { setBusy(false); }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this worksheet?")) return;
    await api.delete(`/admin/worksheets/${id}`);
    refresh();
  };

  return (
    <div data-testid="admin-worksheets">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-navy">Worksheets</h1>
          <p className="text-muted-foreground">{items.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" data-testid="add-worksheet-btn"><Plus className="w-4 h-4 mr-2" /> New worksheet</button>
      </div>

      {showForm && <WorksheetForm onCancel={() => setShowForm(false)} onCreate={onCreate} busy={busy} err={err} />}

      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm" data-testid="worksheets-table">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Grade</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">PDF</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.worksheet_id} className="border-t border-border">
                <td className="px-4 py-3 max-w-xs truncate">{w.title}</td>
                <td className="px-4 py-3">{w.grade}</td>
                <td className="px-4 py-3 capitalize">{w.subject}</td>
                <td className="px-4 py-3"><span className={`badge badge-${w.level}`}>{w.level}</span></td>
                <td className="px-4 py-3">{w.is_free ? "Free" : formatINR(w.price)}</td>
                <td className="px-4 py-3">{w.has_pdf ? "✓" : "—"}</td>
                <td className="px-4 py-3">{w.is_published ? <span className="badge badge-easy">Live</span> : <span className="badge badge-difficult">Draft</span>}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link to={`/worksheets/${w.worksheet_id}`} target="_blank" className="inline-flex items-center text-navy hover:text-gold"><ExternalLink className="w-4 h-4" /></Link>
                  <button onClick={() => onDelete(w.worksheet_id)} className="text-navy hover:text-red-600" data-testid={`delete-ws-${w.worksheet_id}`}><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorksheetForm({ onCancel, onCreate, busy, err }) {
  const [fields, setFields] = useState({
    title: "", description: "", grade: "1", subject: "english", level: "easy",
    price: 49, pages: 8, is_free: false, is_published: true, cover_image: "",
  });
  const [pdf, setPdf] = useState(null);
  const [sample, setSample] = useState(null);

  const set = (k, v) => setFields((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-navy/40 flex items-start justify-center p-6 overflow-y-auto" data-testid="worksheet-form-modal">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-7 my-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-2xl text-navy">New worksheet</h3>
          <button onClick={onCancel} className="p-2 hover:bg-cream rounded-full" data-testid="close-form"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onCreate({ fields, pdf, sample }); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy">Title</label>
            <input required className="input-field mt-1" value={fields.title} onChange={(e) => set("title", e.target.value)} data-testid="ws-title" />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Description</label>
            <textarea required rows={3} className="input-field mt-1" value={fields.description} onChange={(e) => set("description", e.target.value)} data-testid="ws-description" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium text-navy">Grade</label>
              <select className="input-field mt-1" value={fields.grade} onChange={(e) => set("grade", e.target.value)} data-testid="ws-grade">
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Subject</label>
              <select className="input-field mt-1" value={fields.subject} onChange={(e) => set("subject", e.target.value)} data-testid="ws-subject">
                {SUBJECTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Level</label>
              <select className="input-field mt-1" value={fields.level} onChange={(e) => set("level", e.target.value)} data-testid="ws-level">
                {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Pages</label>
              <input type="number" min={1} className="input-field mt-1" value={fields.pages} onChange={(e) => set("pages", Number(e.target.value))} data-testid="ws-pages" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-navy">Price (₹)</label>
              <input type="number" min={0} className="input-field mt-1" value={fields.price} onChange={(e) => set("price", Number(e.target.value))} data-testid="ws-price" />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Cover image URL</label>
              <input className="input-field mt-1" value={fields.cover_image} onChange={(e) => set("cover_image", e.target.value)} data-testid="ws-cover" placeholder="https://..." />
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={fields.is_free} onChange={(e) => set("is_free", e.target.checked)} data-testid="ws-is-free" /> Free</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={fields.is_published} onChange={(e) => set("is_published", e.target.checked)} data-testid="ws-is-published" /> Published</label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-navy">Worksheet PDF</label>
              <input type="file" accept="application/pdf" className="input-field mt-1" onChange={(e) => setPdf(e.target.files?.[0] || null)} data-testid="ws-pdf-file" />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Sample PDF (preview)</label>
              <input type="file" accept="application/pdf" className="input-field mt-1" onChange={(e) => setSample(e.target.files?.[0] || null)} data-testid="ws-sample-file" />
            </div>
          </div>

          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="ws-form-error">{err}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1" data-testid="ws-submit">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create worksheet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get("/admin/orders").then((r) => setOrders(r.data)); }, []);
  return (
    <div data-testid="admin-orders">
      <h1 className="font-heading text-3xl text-navy mb-6">Orders</h1>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy text-left">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{o.order_id}</td>
                <td className="px-4 py-3">{o.user_email}</td>
                <td className="px-4 py-3">{o.items?.length || 0}</td>
                <td className="px-4 py-3 font-semibold">{formatINR(o.total_amount)}</td>
                <td className="px-4 py-3"><span className={`badge ${o.status === "paid" ? "badge-easy" : o.status === "failed" ? "badge-difficult" : "badge-moderate"}`}>{o.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersList() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get("/admin/users").then((r) => setUsers(r.data)); }, []);
  return (
    <div data-testid="admin-users">
      <h1 className="font-heading text-3xl text-navy mb-6">Users</h1>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Auth</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-border">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3"><span className={`badge ${u.role === "admin" ? "badge-difficult" : "badge-easy"}`}>{u.role}</span></td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{u.auth_provider}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Newsletter() {
  const [subs, setSubs] = useState([]);
  useEffect(() => { api.get("/admin/newsletter").then((r) => setSubs(r.data)); }, []);
  return (
    <div data-testid="admin-newsletter">
      <h1 className="font-heading text-3xl text-navy mb-6">Newsletter ({subs.length})</h1>
      <div className="card-soft p-6">
        <ul className="divide-y divide-border">
          {subs.map((s) => (
            <li key={s.email} className="flex items-center justify-between py-3 text-sm">
              <span>{s.email}</span>
              <span className="text-muted-foreground">{new Date(s.subscribed_at).toLocaleDateString("en-IN")}</span>
            </li>
          ))}
          {subs.length === 0 && <li className="py-6 text-center text-muted-foreground">No subscribers yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Testimonials() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ parent_name: "", location: "", quote: "", child_grade: "", rating: 5, is_featured: true });
  const refresh = () => api.get("/testimonials").then((r) => setItems(r.data));
  useEffect(() => { refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/testimonials", form);
      setForm({ parent_name: "", location: "", quote: "", child_grade: "", rating: 5, is_featured: true });
      refresh();
    } catch (e) { alert(formatErr(e)); }
  };
  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`/admin/testimonials/${id}`);
    refresh();
  };

  return (
    <div data-testid="admin-testimonials">
      <h1 className="font-heading text-3xl text-navy mb-6">Testimonials</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="card-soft p-6 space-y-4">
          <h3 className="font-heading text-xl text-navy">Add testimonial</h3>
          <input required placeholder="Parent name" className="input-field" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} data-testid="t-parent-name" />
          <input required placeholder="Location" className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="t-location" />
          <input placeholder="Child grade (e.g. Grade 3)" className="input-field" value={form.child_grade} onChange={(e) => setForm({ ...form, child_grade: e.target.value })} data-testid="t-child-grade" />
          <textarea required rows={3} placeholder="Quote" className="input-field" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} data-testid="t-quote" />
          <button className="btn-primary" data-testid="t-submit">Add</button>
        </form>
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.testimonial_id} className="card-soft p-5 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-heading text-navy mb-1">"{t.quote}"</p>
                <p className="text-xs text-muted-foreground">{t.parent_name} · {t.location}</p>
              </div>
              <button onClick={() => del(t.testimonial_id)} className="text-navy hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Blog() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", cover_image: "", author: "Saksham Learning", is_published: true });
  const [err, setErr] = useState("");

  const refresh = () => api.get("/blog").then((r) => setPosts(r.data));
  useEffect(() => { refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      // fetch full content of new post (need content field), so we send via admin endpoint
      await api.post("/admin/blog", form);
      setForm({ title: "", slug: "", excerpt: "", content: "", cover_image: "", author: "Saksham Learning", is_published: true });
      refresh();
    } catch (e) { setErr(formatErr(e)); }
  };
  const del = async (post_id) => {
    if (!window.confirm("Delete this post?")) return;
    await api.delete(`/admin/blog/${post_id}`);
    refresh();
  };

  return (
    <div data-testid="admin-blog">
      <h1 className="font-heading text-3xl text-navy mb-6">Blog</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="card-soft p-6 space-y-4">
          <h3 className="font-heading text-xl text-navy">New post</h3>
          <input required placeholder="Title" className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} data-testid="b-title" />
          <input required placeholder="slug" className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} data-testid="b-slug" />
          <input placeholder="Cover image URL" className="input-field" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
          <textarea required rows={2} placeholder="Excerpt" className="input-field" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} data-testid="b-excerpt" />
          <textarea required rows={8} placeholder="Content (markdown ok: ## headings, **bold**)" className="input-field font-mono" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} data-testid="b-content" />
          {err && <div className="text-sm text-red-700">{err}</div>}
          <button className="btn-primary" data-testid="b-submit">Publish</button>
        </form>
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.post_id} className="card-soft p-5 flex items-center gap-3">
              {p.cover_image && <img src={p.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover" />}
              <div className="flex-1">
                <h4 className="font-heading text-navy">{p.title}</h4>
                <p className="text-xs text-muted-foreground">/{p.slug}</p>
              </div>
              <button onClick={() => del(p.post_id)} className="text-navy hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
