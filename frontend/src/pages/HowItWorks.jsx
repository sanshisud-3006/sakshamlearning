import { Link } from "react-router-dom";
import { LEVELS, SUBJECTS, GRADES } from "@/lib/api";
import { CheckCircle2, BookOpen, Download, Printer, Users } from "lucide-react";

export default function HowItWorks() {
  return (
    <div data-testid="how-it-works-page">
      <section className="container-x section-tight">
        <div className="max-w-3xl">
          <span className="label-tag">How Saksham works</span>
          <h1 className="font-heading text-4xl lg:text-6xl text-navy mt-3 leading-[1.05]">
            Three doors. <span className="italic text-gold">One brand.</span>
            <br />Every child welcome.
          </h1>
          <p className="text-lg text-muted-foreground mt-6">
            Pick the level that fits today — not yesterday's textbook expectation. Move up when ready. No child left behind. No child held back.
          </p>
        </div>
      </section>

      <section className="bg-cream section">
        <div className="container-x">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {LEVELS.map((lvl, idx) => {
              const bg = { easy: "bg-difficulty-easy", moderate: "bg-difficulty-moderate", difficult: "bg-difficulty-difficult" }[lvl.key];
              const tip = {
                easy: "Best for: rebuilding confidence, introducing new topics, or warm-up practice. Always start here — even if your child is ahead.",
                moderate: "Best for: regular grade-level practice. The 'main course' of mastering a topic with confidence.",
                difficult: "Best for: stretching able learners, exam prep, or after Moderate feels easy. Designed to challenge — never to defeat.",
              }[lvl.key];
              return (
                <div key={lvl.key} className={`card-soft border-0 ${bg} p-8`} data-testid={`level-detail-${lvl.key}`}>
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="font-heading text-7xl text-navy/90 font-medium leading-none">{idx + 1}</span>
                    <span className="text-3xl text-gold tracking-widest">{lvl.stars}</span>
                  </div>
                  <h2 className="font-heading text-3xl text-navy mb-3">{lvl.label}</h2>
                  <p className="text-navy/70 leading-relaxed mb-5">{lvl.desc}.</p>
                  <p className="text-sm text-navy/80 leading-relaxed border-t border-navy/10 pt-4">{tip}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-x section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-heading text-3xl lg:text-4xl text-navy mb-6">What's inside every Saksham pack</h2>
            <ul className="space-y-4">
              {[
                "Carefully curated questions — not random worksheets",
                "Three difficulty levels for every topic",
                "Aligned with CBSE NCF-SE 2023 & NEP 2020",
                "Complete answer keys included with every pack",
                "Beautifully laid out for printing — clean, distraction-free",
                "Designed by a real teacher with 15 years of classroom experience",
              ].map((b) => (
                <li key={b} className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" /><span className="text-navy/80 leading-relaxed">{b}</span></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-3xl lg:text-4xl text-navy mb-6">Get started in 60 seconds</h2>
            <ol className="space-y-5">
              {[
                { icon: BookOpen, title: "Pick your child's grade & subject", text: "From KG to Class IX — across English, Maths, Science and SST." },
                { icon: Users, title: "Choose a level", text: "Easy, Moderate, or Difficult — same topic, different slope." },
                { icon: Download, title: "Download instantly", text: "PDF lands in your library forever — re-download anytime." },
                { icon: Printer, title: "Print & practice", text: "Just print, sit beside your child, and watch confidence grow." },
              ].map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-navy text-ivory flex items-center justify-center flex-shrink-0 font-heading font-medium text-lg">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-navy mb-1 flex items-center gap-2"><s.icon className="w-5 h-5 text-gold" /> {s.title}</h3>
                    <p className="text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-cream section">
        <div className="container-x">
          <h2 className="font-heading text-3xl lg:text-4xl text-navy mb-8 text-center">Coverage at a glance</h2>
          <div className="card-soft overflow-hidden max-w-4xl mx-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-ivory text-left">
                <tr>
                  <th className="px-5 py-4 font-semibold">Grade</th>
                  {SUBJECTS.map((s) => <th key={s.key} className="px-5 py-4 font-semibold">{s.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {GRADES.map((g, i) => (
                  <tr key={g} className={i % 2 ? "bg-cream/50" : ""}>
                    <td className="px-5 py-3 font-semibold text-navy">{g === "KG" ? "KG" : `Class ${g}`}</td>
                    {SUBJECTS.map((s) => <td key={s.key} className="px-5 py-3 text-muted-foreground">3 levels per topic</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-10">
            <Link to="/shop" className="btn-primary" data-testid="how-it-works-shop-cta">Start exploring</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
