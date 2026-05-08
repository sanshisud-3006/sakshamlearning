import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, BookOpen, ShieldCheck, Heart, Award, Star } from "lucide-react";
import api, { SUBJECTS, LEVELS } from "@/lib/api";
import WorksheetCard from "@/components/WorksheetCard";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/e476bd10-21d2-43ca-bb93-03f5d4e8cf3f/images/ac2e6fbecd8ba14b83091f15c56aa5cf71f6757156ddc0e324fc161b7f653d8d.png";
const DETAIL_IMG = "https://static.prod-images.emergentagent.com/jobs/e476bd10-21d2-43ca-bb93-03f5d4e8cf3f/images/d60cd7a029cc573c716cb1679b76e7f846a040d8783c6babd863d9a63327be61.png";

export default function Home() {
  const [worksheets, setWorksheets] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get("/worksheets?limit=8").then((r) => setWorksheets(r.data)).catch(() => {});
    api.get("/testimonials").then((r) => setTestimonials(r.data)).catch(() => {});
    api.get("/blog").then((r) => setPosts(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden hero-grain" data-testid="hero-section">
        <div className="container-x pt-12 lg:pt-20 pb-20 lg:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-cream px-4 py-2 rounded-full mb-6 border border-gold/20" data-testid="hero-eyebrow">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="label-tag">Crafted by a CBSE educator · 15 years</span>
            </div>
            <h1 className="font-heading font-medium text-[40px] sm:text-5xl lg:text-[64px] leading-[1.05] tracking-tight text-navy mb-6">
              Every child is capable —
              <br />
              <span className="italic text-gold">of learning at their pace,</span>
              <br />
              in their place.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
              Thoughtfully designed, curriculum-aligned worksheets for KG to Class IX. Three difficulty levels per topic — so every child is met exactly where they are.
            </p>
            <div className="flex flex-wrap gap-4" data-testid="hero-cta-row">
              <Link to="/shop" className="btn-primary" data-testid="hero-shop-cta">
                Browse Worksheets <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/how-it-works" className="btn-outline" data-testid="hero-learn-cta">
                The 3-Level System
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-navy/70">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gold" /> CBSE · NCF-SE 2023 aligned</div>
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gold" /> Full answer keys included</div>
              <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-gold" /> 5,000+ Indian families</div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-4 bg-navy rounded-3xl rotate-3 -z-10" />
            <img
              src={HERO_IMG}
              alt="Saksham Learning worksheets"
              className="rounded-2xl shadow-warm w-full object-cover aspect-[4/5]"
              data-testid="hero-image"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-border p-5 max-w-[230px] hidden md:block">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map((n) => <Star key={n} className="w-4 h-4 fill-gold text-gold" />)}
              </div>
              <p className="text-sm font-medium text-navy leading-snug">"Finally, a brand made by a real teacher."</p>
              <p className="text-xs text-muted-foreground mt-2">— Anjali, parent of Grade 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 LEVELS */}
      <section className="bg-cream section" data-testid="levels-section">
        <div className="container-x">
          <div className="max-w-3xl mb-12">
            <span className="label-tag">The 3-Level System</span>
            <h2 className="font-heading text-4xl lg:text-5xl text-navy mt-3 leading-tight">
              No child is left behind.
              <br /><span className="italic">No child is held back.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LEVELS.map((lvl, idx) => {
              const bg = { easy: "bg-difficulty-easy", moderate: "bg-difficulty-moderate", difficult: "bg-difficulty-difficult" }[lvl.key];
              return (
                <div key={lvl.key} className={`card-soft ${bg} border-0 p-8 flex flex-col`} data-testid={`level-card-${lvl.key}`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-heading text-6xl font-medium text-navy/90">{idx + 1}</span>
                    <span className="text-3xl text-gold tracking-widest">{lvl.stars}</span>
                  </div>
                  <h3 className="font-heading text-2xl text-navy mb-2">{lvl.label}</h3>
                  <p className="text-navy/70 leading-relaxed">{lvl.desc}. Confidence first — every step, every page.</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="section" data-testid="subjects-section">
        <div className="container-x">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span className="label-tag">Subjects we cover</span>
              <h2 className="font-heading text-4xl lg:text-5xl text-navy mt-3">Four subjects. Ten grades. One promise.</h2>
            </div>
            <Link to="/shop" className="btn-ghost">Browse all <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUBJECTS.map((s) => (
              <Link
                key={s.key}
                to={`/shop?subject=${s.key}`}
                className="rounded-2xl p-7 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform"
                style={{ backgroundColor: s.color }}
                data-testid={`subject-card-${s.key}`}
              >
                <BookOpen className="w-9 h-9 mb-8 opacity-80" />
                <h3 className="font-heading text-2xl mb-1">{s.label}</h3>
                <p className="text-sm text-white/80">KG to Class IX · 3 levels per topic</p>
                <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED WORKSHEETS */}
      <section className="bg-cream section" data-testid="featured-section">
        <div className="container-x">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
            <div>
              <span className="label-tag">Fresh from the desk</span>
              <h2 className="font-heading text-4xl lg:text-5xl text-navy mt-3">New & loved worksheets</h2>
            </div>
            <Link to="/shop" className="btn-outline">Shop all worksheets</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {worksheets.slice(0, 8).map((w) => <WorksheetCard key={w.worksheet_id} w={w} />)}
          </div>
        </div>
      </section>

      {/* PROMISE STRIP */}
      <section className="bg-navy text-ivory section" data-testid="promise-section">
        <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <img src={DETAIL_IMG} alt="Saksham worksheet detail" className="rounded-2xl w-full object-cover aspect-square" />
          </div>
          <div className="lg:col-span-7">
            <span className="label-tag !text-gold-light">Our brand promise</span>
            <h2 className="font-heading text-4xl lg:text-5xl mt-3 leading-tight">
              You're not buying a worksheet.<br />
              <span className="italic text-gold-light">You're investing in your child's confidence.</span>
            </h2>
            <p className="text-lg text-ivory/80 mt-6 leading-relaxed max-w-2xl">
              Every page is designed by an experienced educator, aligned with the latest curriculum, and crafted to meet your child exactly where they are — so they always feel capable, never overwhelmed, and always growing.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/about" className="btn-primary">Read our story</Link>
              <Link to="/shop" className="btn-outline !text-ivory !border-ivory hover:!bg-ivory hover:!text-navy">Explore worksheets</Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" data-testid="testimonials-section">
        <div className="container-x">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="label-tag">Parents are talking</span>
            <h2 className="font-heading text-4xl lg:text-5xl text-navy mt-3">Loved in homes across India.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 6).map((t) => (
              <div key={t.testimonial_id} className="bg-cream rounded-2xl p-7 border-t-4 border-gold" data-testid={`testimonial-${t.testimonial_id}`}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
                </div>
                <p className="font-heading text-lg leading-relaxed text-navy mb-5">"{t.quote}"</p>
                <div className="text-sm">
                  <div className="font-semibold text-navy">{t.parent_name}</div>
                  <div className="text-muted-foreground">{t.location}{t.child_grade ? ` · Parent of ${t.child_grade}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      {posts.length > 0 && (
        <section className="bg-cream section" data-testid="blog-preview-section">
          <div className="container-x">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
              <div>
                <span className="label-tag">Tips for parents</span>
                <h2 className="font-heading text-4xl lg:text-5xl text-navy mt-3">From our journal</h2>
              </div>
              <Link to="/blog" className="btn-ghost">All articles <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((p) => (
                <Link key={p.post_id} to={`/blog/${p.slug}`} className="card-soft overflow-hidden group" data-testid={`blog-card-${p.slug}`}>
                  {p.cover_image && (
                    <div className="aspect-[4/3] overflow-hidden bg-cream">
                      <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-heading text-xl text-navy leading-snug mb-2 group-hover:text-gold transition">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-navy text-ivory" data-testid="bottom-cta-section">
        <div className="container-x section text-center max-w-3xl mx-auto">
          <span className="label-tag !text-gold-light">Try before you buy</span>
          <h2 className="font-heading text-4xl lg:text-5xl mt-3 leading-tight">
            Download a free Saksham worksheet
          </h2>
          <p className="text-ivory/80 mt-5 text-lg">No card. No sign-up. Just see for yourself why Indian parents trust us.</p>
          <Link to="/shop?free=1" className="btn-primary mt-8" data-testid="free-sample-cta">Get a free sample <ArrowRight className="w-4 h-4 ml-2" /></Link>
        </div>
      </section>
    </div>
  );
}
