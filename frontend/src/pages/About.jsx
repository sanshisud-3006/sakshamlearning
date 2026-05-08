import { Link } from "react-router-dom";
import { LOGO_URL } from "@/lib/api";
import { Heart, Award, ShieldCheck, Sparkles, GraduationCap } from "lucide-react";

const VALUES = [
  { icon: Award, title: "Excellence", text: "Every worksheet meets the highest standard — your child deserves nothing less. Quality you can feel." },
  { icon: Heart, title: "Confidence", text: "We design to build belief — so children approach every challenge saying 'I can do this.' Easy first, always." },
  { icon: ShieldCheck, title: "Affordability", text: "Quality learning shouldn't be a privilege. Accessible to every Indian family, metro or small town." },
  { icon: GraduationCap, title: "Inclusivity", text: "From the child who needs more practice to the one ready to be challenged — we have a place for every learner." },
  { icon: Sparkles, title: "Curiosity", text: "We don't just teach — we make children ask 'Why?' and 'What if?' That's real learning. That's Saksham." },
];

export default function About() {
  return (
    <div data-testid="about-page">
      <section className="container-x section-tight">
        <div className="max-w-3xl">
          <span className="label-tag">Our story</span>
          <h1 className="font-heading text-4xl lg:text-6xl text-navy mt-3 leading-[1.05]">
            Born from <span className="italic text-gold">15 years</span> in classrooms.
          </h1>
        </div>
      </section>

      <section className="bg-cream section">
        <div className="container-x grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="bg-navy rounded-2xl p-10 text-ivory">
              <img src={LOGO_URL} alt="" className="w-24 h-24 bg-white rounded-xl p-2 mb-6" />
              <p className="font-heading italic text-2xl leading-relaxed">"Saksham" means capable. It is what every child is — and what every parent believes.</p>
              <p className="text-ivory/70 text-sm mt-4">— The Saksham Promise</p>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-5 text-lg text-navy/80 leading-relaxed">
            <p>Saksham Learning was born from 15 years of watching children in classrooms — the ones who soared, the ones who struggled, and the ones who just needed the right resource at the right level to finally say, <em>'I got it.'</em></p>
            <p>Founded by an experienced CBSE educator based in Delhi, Saksham Learning creates thoughtfully designed, curriculum-aligned worksheets for students from KG to Class IX — across English, Mathematics, Science, and Social Studies.</p>
            <p>Each topic comes in three difficulty levels — Easy, Moderate, and Difficult — because we believe every child deserves to be met where they are, not where the textbook expects them to be.</p>
            <p className="font-heading italic text-2xl text-navy">We are not a big corporation. We are a passionate educator who genuinely cares about your child's growth. And that is exactly why parents trust us.</p>
          </div>
        </div>
      </section>

      <section className="container-x section">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="label-tag">What we stand for</span>
          <h2 className="font-heading text-4xl lg:text-5xl text-navy mt-3">Five values. One belief.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {VALUES.map((v, idx) => (
            <div key={v.title} className="card-soft p-7" data-testid={`value-${v.title.toLowerCase()}`}>
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-5">
                <v.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-heading text-xl text-navy mb-2">{idx + 1}. {v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-ivory section">
        <div className="container-x text-center max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl lg:text-5xl">Walk with us.</h2>
          <p className="text-ivory/80 mt-5 text-lg">From your child's very first worksheet to their last big exam — we'd be honoured to be there for the whole journey.</p>
          <Link to="/shop" className="btn-primary mt-8" data-testid="about-shop-cta">Browse worksheets</Link>
        </div>
      </section>
    </div>
  );
}
