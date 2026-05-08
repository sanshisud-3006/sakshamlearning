# Saksham Learning — Product Requirements Document

## Original Problem Statement
"read the document uploaded and build me exactly what im looking for, i have also attached a logo with it"

User uploaded `Saksham_Learning_Brand_Foundation.docx` and `saksham_logo.png`. The brand is an Indian home-learning company that sells curriculum-aligned, level-wise printable worksheets for KG to Class IX across English, Mathematics, Science and SST/EVS — designed by an experienced CBSE educator.

## User Choices (V1)
- Build BOTH marketing site + working e-commerce store
- Razorpay payments (test mode → currently MOCK MODE while real keys are pending)
- Parent accounts with My Library (purchased PDFs)
- Email/password JWT auth + Emergent-managed Google login
- Admin panel for managing worksheets, orders, blog, testimonials, newsletter
- Newsletter signup, free sample worksheets, blog/tips, WhatsApp button, testimonials

## Architecture
- Backend: FastAPI (single `server.py`) + MongoDB (Motor) + bcrypt JWT cookie auth + Razorpay SDK
- Frontend: React 19 + Tailwind + craco (`@/` alias) + react-router-dom
- Storage: PDFs in `/app/backend/uploads/` (worksheets/, samples/), gated downloads
- Fonts: Fraunces (headings) + Manrope (body) — heritage premium aesthetic

## User Personas
1. **Parent (primary buyer)** — wants the right worksheet, at the right level, for their child
2. **Admin (founder/educator)** — uploads PDFs, manages catalog, blog, orders, customers
3. **Browsing visitor** — reads the story, downloads a free sample, joins newsletter

## Core Requirements (Static)
- Brand: warm, trustworthy, educator-crafted; navy + gold heritage palette
- Tagline always visible: "Every child is capable — of learning at their pace, in their place."
- 3-level system (Easy ★ / Moderate ★★ / Difficult ★★★) is core to product UX
- All paid downloads gated by ownership check
- Mobile-first responsive

## What's Been Implemented (V1 — Jan 2026)
### Marketing site
- Home: hero + 3-level system + 4 subjects + featured worksheets + testimonials + blog preview + newsletter CTA
- About / Our Story (mission, vision, 5 values)
- How It Works (deep dive into 3 levels + getting-started steps + coverage matrix)
- Blog index + detail (3 seeded posts, markdown-style content rendering)
- Footer newsletter signup + WhatsApp floating button

### E-commerce
- Shop page with filters: Grade (KG–9), Subject, Level (Easy/Mod/Diff), Free toggle, search, mobile drawer
- Worksheet detail page with sample preview + Add to Cart + Buy Now
- Cart with localStorage persistence
- Checkout (Razorpay MOCK MODE; real flow wired up — only swap keys & flip flag)
- Order success page
- My Library (purchased downloads + order history)

### Auth
- Register / Login (email + password, JWT cookie + localStorage Bearer fallback)
- Emergent-managed Google OAuth (login → /auth/callback → backend session exchange → app JWT)
- Protected routes (`/checkout`, `/library`, `/admin`)
- Admin role-guarded `/admin`

### Admin Panel
- Dashboard (revenue, orders, customers, worksheets, newsletter subs)
- Worksheets CRUD with PDF + sample PDF upload (multipart)
- Orders table
- Users list (role, auth provider, joined)
- Newsletter subscribers
- Testimonials CRUD
- Blog post create + delete

### Seed Data
- Admin user (info@sakshamlearning.com)
- Test parent (parent@test.com)
- 448 worksheets across all grade × subject × level combinations (with 4 free samples)
- 6 testimonials
- 3 blog posts

## Tested & Verified
- Backend: 28/28 pytest cases passed (100%)
- Frontend: full flow validated — login, shop, filter, add to cart, checkout (mock), order success, library, admin
- Lint: 0 issues (Python + JavaScript)

## Backlog / Next Phase (P1)
- Replace Razorpay MOCK with real test keys (drop `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` into `/app/backend/.env`, set `RAZORPAY_MOCK_MODE=false`, restart backend) — code path already in place
- Forgot-password / reset-password flow (endpoints stubbed in spec, not yet built)
- Admin: edit worksheet (currently delete + re-create), bulk PDF upload, sales charts
- Email notifications (order receipt, password reset) — needs SendGrid/Resend integration
- Hindi medium worksheets (Year 2 plan from brand doc)
- SEO meta tags, sitemap, OG tags
- Replace `CORS_ORIGINS=*` with explicit `FRONTEND_URL` for production cookie auth

## Deferred / Known Limitations
- Sample PDFs and full PDFs are not pre-uploaded for seed worksheets (admin must upload via /admin/worksheets) — buying a seeded worksheet shows "PDF being prepared" on download. This is by design — real PDFs are owner content.
- Google OAuth requires the Emergent flow to be authenticated end-to-end via real browser; can't be unit tested without a real session.

## Credentials
See `/app/memory/test_credentials.md`
