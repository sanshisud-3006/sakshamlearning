import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/blog").then((r) => setPosts(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-x section-tight" data-testid="blog-index-page">
      <div className="mb-12 max-w-3xl">
        <span className="label-tag">Tips & journal</span>
        <h1 className="font-heading text-4xl lg:text-6xl text-navy mt-3 leading-[1.05]">
          Practical wisdom for <span className="italic text-gold">Indian parents.</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-5">Short, honest, classroom-tested ideas to make home learning a joy.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card-soft animate-pulse aspect-[4/5] bg-cream" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {posts.map((p) => (
            <Link key={p.post_id} to={`/blog/${p.slug}`} className="card-soft overflow-hidden group" data-testid={`blog-card-${p.slug}`}>
              {p.cover_image && (
                <div className="aspect-[4/3] overflow-hidden bg-cream">
                  <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6">
                <div className="text-xs uppercase tracking-wider text-gold font-semibold mb-2">{new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                <h3 className="font-heading text-xl text-navy leading-snug mb-3 group-hover:text-gold transition">{p.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get(`/blog/${slug}`).then((r) => setPost(r.data)).catch(() => setErr(true));
  }, [slug]);

  if (err) return (
    <div className="container-x section text-center" data-testid="blog-detail-error">
      <h1 className="font-heading text-3xl text-navy">Post not found</h1>
      <Link to="/blog" className="btn-primary mt-6">Back to blog</Link>
    </div>
  );

  if (!post) return <div className="container-x section-tight text-muted-foreground">Loading…</div>;

  // Render simple markdown-ish content (## and paragraphs) without an external dep
  const renderContent = () => {
    return post.content.split(/\n\n+/).map((block, i) => {
      if (block.startsWith("## ")) return <h2 key={i} className="font-heading text-3xl text-navy mt-10 mb-4">{block.slice(3)}</h2>;
      if (block.startsWith("### ")) return <h3 key={i} className="font-heading text-2xl text-navy mt-8 mb-3">{block.slice(4)}</h3>;
      if (/^\d+\.\s/.test(block)) {
        return (
          <ol key={i} className="list-decimal pl-6 space-y-2 text-navy/80 leading-relaxed mb-5">
            {block.split("\n").map((li, j) => <li key={j}>{li.replace(/^\d+\.\s/, "")}</li>)}
          </ol>
        );
      }
      if (block.startsWith("- ")) {
        return (
          <ul key={i} className="list-disc pl-6 space-y-2 text-navy/80 leading-relaxed mb-5">
            {block.split("\n").map((li, j) => <li key={j}>{li.replace(/^- /, "")}</li>)}
          </ul>
        );
      }
      return <p key={i} className="text-navy/80 leading-relaxed mb-5 text-lg">{block}</p>;
    });
  };

  return (
    <article className="container-x section-tight max-w-3xl" data-testid="blog-detail-page">
      <Link to="/blog" className="inline-flex items-center gap-2 text-navy hover:text-gold mb-8 text-sm font-medium" data-testid="back-to-blog">
        <ArrowLeft className="w-4 h-4" /> All articles
      </Link>
      <div className="text-xs uppercase tracking-wider text-gold font-semibold mb-3">
        {new Date(post.created_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })} · {post.author}
      </div>
      <h1 className="font-heading text-4xl lg:text-5xl text-navy leading-tight mb-8" data-testid="blog-title">{post.title}</h1>
      {post.cover_image && <img src={post.cover_image} alt="" className="rounded-2xl w-full aspect-[16/9] object-cover mb-10" />}
      <p className="text-xl text-muted-foreground leading-relaxed mb-10 italic font-heading">{post.excerpt}</p>
      <div className="prose-saksham">{renderContent()}</div>
    </article>
  );
}
