# ResumeCraft SEO Guide — What Everything Means and Why It Was Done

This document explains every SEO (Search Engine Optimization) concept that was
applied to ResumeCraft in plain language — what it is, why Google cares about
it, exactly what was changed in this codebase, and how you can verify or
maintain it. Read this once and you'll understand both the "what" and the
"why" behind the site's search setup.

Companion files:
- `SEO-CHECKLIST.md` — the short status table + Search Console steps
- `BACKLINK-STRATEGY.md` — how to get other sites to link to you

Canonical domain: **https://resumecraftco.vercel.app**

---

## Table of Contents

1. [How Google actually finds your site](#1-how-google-actually-finds-your-site)
2. [robots.txt](#2-robotstxt)
3. [sitemap.xml](#3-sitemapxml)
4. [Meta titles](#4-meta-titles)
5. [Meta descriptions](#5-meta-descriptions)
6. [Canonical tags](#6-canonical-tags)
7. [noindex / nofollow](#7-noindex--nofollow)
8. [OpenGraph (og:) and Twitter Card tags](#8-opengraph-og-and-twitter-card-tags)
9. [og:image / social preview](#9-ogimage--social-preview)
10. [Schema markup (JSON-LD structured data)](#10-schema-markup-json-ld-structured-data)
11. [Header hierarchy (h1–h6)](#11-header-hierarchy-h1h6)
12. [Alt text on images](#12-alt-text-on-images)
13. [Core Web Vitals](#13-core-web-vitals)
14. [Image compression](#14-image-compression)
15. [HTTPS enforcement](#15-https-enforcement)
16. [URL slugs](#16-url-slugs)
17. [Internal links](#17-internal-links)
18. [Broken links](#18-broken-links)
19. [Mobile responsiveness](#19-mobile-responsiveness)
20. [Search Console verification](#20-search-console-verification)
21. [Backlinks (off-page SEO)](#21-backlinks-off-page-seo)
22. [The critical bug that was found](#22-the-critical-bug-that-was-found)
23. [How the SPA serves SEO tags (technical)](#23-how-the-spa-serves-seo-tags-technical)
24. [File-by-file change map](#24-file-by-file-change-map)
25. [Maintenance routine](#25-maintenance-routine)

---

## 1. How Google actually finds your site

Google runs three continuous processes:

1. **Crawling** — automated programs ("Googlebot") follow links and fetch
   pages. `robots.txt` and `sitemap.xml` (sections 2 and 3) guide this step.
2. **Indexing** — Google analyzes each page: its title, headings, text,
   structured data, mobile layout, and speed. Sections 4–14 optimize this.
3. **Ranking** — for each search query, Google orders indexed pages by
   relevance (do your words match the query?) and authority (do other trusted
   sites link to you?). Sections 4, 10, 11 affect relevance; section 21
   (backlinks) affects authority.

A brand-new site is in none of these systems. That's why Search Console
verification (section 20) matters: it's how you introduce the site to Google
and watch all three processes.

**Important context for ResumeCraft:** this is a React single-page app (SPA).
For years, SPAs were bad at SEO because the HTML served by the server was
empty and JavaScript filled it in later. Google now executes JavaScript, but
this works reliably only when key tags are present in the raw HTML *and* when
client-side updates are done cleanly — which is exactly what this project now
does (see section 23).

---

## 2. robots.txt

**What it is:** a plain text file at `https://your-site/robots.txt` that tells
crawlers which parts of the site they may or may not fetch.

**Why it matters:** without it you're relying on defaults. With it, you can
keep private or useless pages out of Google's crawl budget and declare where
your sitemap lives.

**What was done:** created `frontend/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /editor
Disallow: /api
Sitemap: https://resumecraftco.vercel.app/sitemap.xml
```

- `User-agent: *` = every crawler.
- `/dashboard`, `/editor` are logged-in-only screens with no value to a
  searcher — blocking them saves crawl budget and keeps empty private pages
  out of results.
- `/api` is machine JSON, not a web page.
- Crawl-delays for aggressive SEO bots (Ahrefs, Semrush) protect the backend
  from over-crawling. Googlebot ignores this directive (it uses its own rate
  limits), which is normal.

**Verify:** visit `/robots.txt` on the deployed site. **Maintain:** whenever
you add a private route, add a `Disallow` line for it.

---

## 3. sitemap.xml

**What it is:** a machine-readable list of the pages you *want* indexed, with
metadata (last modified, update frequency, priority).

**Why it matters:** Google doesn't have to discover pages by following links.
A sitemap is especially important for a new site with few external links
pointing at it.

**What was done:** created `frontend/public/sitemap.xml` listing exactly the
three indexable pages — `/` (priority 1.0), `/privacy` and `/terms` (0.3).
Login/register/dashboard/editor are deliberately absent: a sitemap should
never list pages that are noindexed or require login (Google flags that as an
error in Search Console).

**Verify:** visit `/sitemap.xml`; it must be valid XML (it is — tested).
**Maintain:** every time you add a public page (e.g. a blog post), add a
`<url>` entry and update the `<lastmod>` date.

---

## 4. Meta titles

**What it is:** the `<title>` tag — the clickable headline in Google results
and the text on the browser tab.

**Why it matters:** it is the single strongest on-page relevance signal, and
it's the first thing a searcher reads. Google truncates around 55–60
characters.

**What was done:** previously the whole SPA had one hardcoded title on every
"page". Now `frontend/src/components/SEO.jsx` sets a unique title per route:

| Route | Title |
|---|---|
| `/` | Free AI Resume Builder & ATS Score Checker \| ResumeCraft |
| `/login` | Sign In \| ResumeCraft |
| `/register` | Create a Free Account \| ResumeCraft |
| `/dashboard` | Dashboard \| ResumeCraft |
| `/editor/:id` | Resume Editor \| ResumeCraft |
| `/privacy` | Privacy Policy \| ResumeCraft |
| `/terms` | Terms of Service \| ResumeCraft |

The landing title targets the two searches a job seeker actually types:
"resume builder" and "ATS score checker", with the differentiator ("Free",
"AI") up front.

---

## 5. Meta descriptions

**What it is:** the two-line summary under the blue link in Google results.
It doesn't directly affect ranking, but it determines whether people click.

**Why it matters:** Google shows it (or writes its own from page text) when
it's missing. Writing it yourself means controlling your sales pitch in
results.

**What was done:** a tailored description per route via the same `SEO.jsx`
component. The landing description names the mechanism (Gemini parsing, live
ATS checks, print-ready PDF) and ends with "free" — the deciding word for the
target audience. Keep descriptions ~140–160 characters; longer ones get cut.

---

## 6. Canonical tags

**What it is:** a `<link rel="canonical" href="...">` that tells Google:
"this is the one official URL for this content."

**Why it matters:** the same content reachable at multiple URLs
(`example.com`, `www.example.com`, with/without query strings, HTTP vs HTTPS)
splits ranking credit across duplicates. The canonical merges that credit
into one URL.

**What was done:** a default canonical in `index.html`, updated per route by
`SEO.jsx` so `/login`'s canonical is the login URL, not the homepage's. All
canonicals use the bare production domain — pick one form (www vs non-www)
and never mix; if you later buy a custom domain, change `SITE_URL` in
`SEO.jsx` plus the URLs in `index.html`, `robots.txt`, and `sitemap.xml` all
together.

---

## 7. noindex / nofollow

**What it is:** a robots meta tag that stops a page from being indexed
(`noindex`) and stops link-credit from flowing through it (`nofollow`):

```html
<meta name="robots" content="noindex, nofollow" />
```

**Why it matters:** your task said "remove noindex tags" — there were none to
remove (verified). But the *correct* use of noindex is the opposite move:
private or duplicate pages *should* be noindexed so Google doesn't waste
index slots on your login screen or show "Dashboard" to searchers who can't
log in.

**What was done:** `/login`, `/register`, `/dashboard`, and `/editor` now
send `noindex, nofollow` (set by `SEO.jsx`); all public pages send
`index, follow, max-image-preview:large` (the last part allows Google to show
a large preview image in Discover).

---

## 8. OpenGraph (og:) and Twitter Card tags

**What it is:** metadata that social platforms (Facebook, LinkedIn, WhatsApp,
Slack, X/Twitter, iMessage…) read to build the link preview card — image,
title, description.

**Why it matters:** when someone shares your link in a group chat or on
LinkedIn, the card *is* your landing page's first impression. Missing tags =
a bare URL with possibly a random image.

**What was done:** `index.html` now has a complete set: `og:site_name`,
`og:locale`, `og:type`, `og:url`, `og:title`, `og:description`, `og:image`
with `og:image:width/height/type/alt`, and the Twitter equivalents
(`twitter:card: summary_large_image`, title, description, image, alt).
`SEO.jsx` keeps og/twitter title+description in sync when you navigate, so a
shared `/privacy` link doesn't advertise the homepage.

---

## 9. og:image / social preview

**What it is:** the image shown in the share card. Recommended size:
1200×630 pixels (1.91:1), under ~600 KB.

**Why it matters:** your old tag pointed to
`https://resumecraftco.vercel.app/social-preview.png` — **a file that
did not exist**. Every share on every platform showed a broken or blank card,
and it counted as a broken link.

**What was done:** generated a real 1200×630 PNG (brand gradient, checkmark
logo, tagline, feature pills, a resume mockup with the 82 ATS score ring) and
saved it to `frontend/public/social-preview.png` (55 KB). It's reproducible:
`python frontend/scripts/generate-social-preview.py`. PNG was chosen over JPG
because the design is flat colors (PNG compresses those better with no
artifacts).

**Verify after deploy:** paste the site URL into
<https://developers.facebook.com/tools/debug/> or LinkedIn's Post Inspector —
they'll show the exact card and refresh their cache.

---

## 10. Schema markup (JSON-LD structured data)

**What it is:** machine-readable data embedded in the page using
[schema.org](https://schema.org) vocabulary, in a `<script type="application/ld+json">`
block. Google parses it to understand *what your page is* (a product? an
organization? an FAQ?) and can display "rich results" — star ratings, FAQ
dropdowns, price badges — directly in search results.

**Why it matters:** it's the difference between a plain blue link and a
listing that also shows your FAQ questions inline. It also removes guesswork
about what your software does.

**What was done:**

1. **Fixed the fatal bug** (details in section 22): the JSON-LD block was
   never closed with `</script>`, so the markup was invalid and silently
   ignored.
2. `index.html` now carries a valid global block with three entities:
   - `WebApplication` — name, URL, category, price 0.00 (free), feature list.
     `offers.price: 0.00` can surface a "Free" annotation.
   - `Organization` — brand name, logo, image.
   - `WebSite` — ties the entities together.
3. The landing page injects a `FAQPage` block with the four visible
   questions/answers. Google requires that structured data matches visible
   content — which is guaranteed here because `Landing.jsx` builds the JSON-LD
   from the *same array* it renders the accordion from. Editing an answer
   updates both.
4. `SEO.jsx` removes the route-scoped block when you navigate away, so
   `/login` never ships FAQ markup for content it doesn't contain (mismatched
   markup is treated as spam).

**Verify after deploy:** <https://search.google.com/test/rich-results> —
expect FAQPage (landing), WebApplication, Organization, WebSite all valid.

---

## 11. Header hierarchy (h1–h6)

**What it is:** the semantic outline of a page. `<h1>` is the page's main
topic; `<h2>`s are its sections; `<h3>`s are subsections.

**Why it matters:** Google uses headings to understand page structure, and
**one h1 per page** is the classic rule — multiple h1s blur "what this page is
about." Skipped levels (h2 followed by h4) make the outline incoherent.

**What was found and fixed:**

- Landing, Login, Register, Dashboard already had a single h1 each. ✔
- Register's decorative side-panel h2 appeared *before* the h1 in the DOM —
  the first heading on the page must be the h1. Converted to a styled `<p>`.
- The cookie banner used an `h4` floating outside the outline → now a `<p>`
  (it's an overlay dialog, not document content).
- **The Editor was the big one:** all four resume templates used `<h1>` for
  the candidate's name, `<h2>` for the job title, and `renderSection()` used
  `<h3>` for "EXPERIENCE"-style headers, plus an `<h4>` "Contact" label. Those
  are *document content* — a resume preview is not the page's outline. All
  converted to `div`s with identical classes/inline styles (zero visual
  change), the section-title CSS selector updated from
  `.custom-sidebar-widgets h3` to `.custom-sidebar-widgets .resume-section-title`,
  and an `<h1 class="sr-only">Resume Editor</h1>` was added so the page still
  has exactly one top-level heading.
- FAQ accordion questions are now wrapped in `<h3>` (under the FAQ `<h2>`),
  which also strengthens the FAQPage rich-result match.

**Rule going forward:** exactly one h1; h2 for sections; never skip levels;
never use heading tags for styling inside rendered documents.

---

## 12. Alt text on images

**What it is:** the `alt` attribute on `<img>` describing the image for
screen readers and for Google Images.

**Why it matters:** accessibility requirement, plus the only way images can
rank in Google Images.

**What was found:** the app contains **zero `<img>` tags** — every visual is
an inline SVG icon or CSS. Nothing to fix, nothing missing. The og:image and
twitter:image now carry `alt` attributes, and the score-ring SVG on the
landing page is decorative with its value ("82", "Score") present as real
text.

**Rule going forward:** any `<img>` you add must ship `alt` (describe what's
shown; empty `alt=""` only for purely decorative images), `width`/`height`
(to prevent layout shift), and `loading="lazy"` for anything below the fold.

---

## 13. Core Web Vitals

**What they are:** Google's three measured user-experience metrics — and a
confirmed (small) ranking factor:

| Metric | Measures | Good |
|---|---|---|
| **LCP** Largest Contentful Paint | When the main content appears | < 2.5 s |
| **INP** Interaction to Next Paint | Responsiveness to taps/clicks | < 200 ms |
| **CLS** Cumulative Layout Shift | How much the page jumps while loading | < 0.1 |

**What was done (and why each helps):**

1. **Fewer render-blocking fonts.** The critical Google Fonts request loaded
   6 families (~40+ font files) before first paint. Cut to 3 — Inter (body),
   Outfit (headings), EB Garamond (landing serif) — with the resume-template
   fonts (Lora, Source Sans 3, Source Code Pro, etc.) moved to the existing
   async `media="print" onload` trick plus a `<noscript>` fallback. Faster
   LCP; the Editor still loads every resume font, just after paint.
2. **Removed a duplicate `@import`** in `Landing.jsx`'s embedded styles that
   fetched EB Garamond a second time with different weights. The needed
   weights (500, italic 500) were merged into the single critical request
   instead — one fetch, identical rendering.
3. **The theme-flash script actually runs now** (see section 22). A dark-mode
   user no longer gets painted light-mode-then-dark — that repaint is both a
   visual bug and wasted LCP time.
4. **Immutable asset caching.** `vercel.json` gives `/assets/*` (Vite's
   hashed filenames) `Cache-Control: public, max-age=31536000, immutable` —
   repeat visits skip the network entirely. `robots.txt`, `sitemap.xml`,
   favicon get 1 hour; the social preview 1 day.
5. **Code-splitting was already in place** (`React.lazy` per page) — each
   route downloads only its own JS. The one large chunk (Editor, 663 KB with
   html2canvas + jsPDF) is behind authentication and never touches landing
   performance.
6. **Layout stability:** no raster images in the layout, and the mockup/hero
   sections have fixed heights, so CLS risk is inherently low.

**Verify after deploy:** <https://pagespeed.web.dev> on the live URL, and
Search Console → Core Web Vitals report after some traffic accrues.

---

## 14. Image compression

**What it is:** shipping images at the smallest size that looks identical.

**What was done:** the only raster asset is the social preview — 55 KB for
1200×630 (a typical photo PNG this size runs 300–800 KB). Generated by
script, so it can be regenerated rather than re-exported by hand. The favicon
is a 623-byte SVG (vector — nothing to compress).

**Rule going forward:** export photos as WebP/AVIF at display size ×2 (for
retina), keep logos/icons as SVG, and never upload a camera-original 5 MB
JPEG straight into `public/`.

---

## 15. HTTPS enforcement

**What it is:** forcing all traffic onto the encrypted protocol and telling
browsers to never try plain HTTP again.

**Why it matters:** HTTPS is a (light) ranking signal, Chrome flags HTTP
pages as "Not secure" (which kills trust), and Google indexes the HTTPS URL
as canonical when both exist.

**What was done — three layers:**

1. **Vercel (the edge):** automatically redirects HTTP→HTTPS for every
   request. Nothing to configure.
2. **`vercel.json`:** added `Strict-Transport-Security:
   max-age=31536000; includeSubDomains` — after the first HTTPS visit, the
   browser refuses HTTP for a full year, closing downgrade-attack windows.
3. **Backend (`backend/server.js`):** a production-only middleware reads
   `X-Forwarded-Proto` (Render/Nginx terminate TLS and forward the original
   protocol in this header) and 301-redirects any plain-HTTP request to its
   HTTPS equivalent. It's a no-op in development and when traffic already
   arrives encrypted — it cannot break local `npm run backend`.

---

## 16. URL slugs

**What it is:** the human-readable path part of a URL — `/resume-editor` vs
`/p?id=8381`.

**Why it matters:** clean slugs appear in results, get pasted and remembered,
and keywords in slugs carry a (tiny) relevance weight.

**What was found:** already clean — `/`, `/login`, `/register`,
`/dashboard`, `/editor/:id` — so nothing needed renaming (renaming existing
URLs without redirects would *lose* equity, so "don't touch" was the right
call). Two pages were added following the convention.

**Convention going forward:** lowercase, hyphens between words, no dates or
IDs in public URLs (`/blog/ats-resume-checklist`, never `/blog/2026/09/20/post-123`).

---

## 17. Internal links

**What they are:** links between your own pages.

**Why they matter:** they're how crawlers discover pages, and they spread
ranking credit ("link equity") across the site. A page with zero internal
links pointing to it is an orphan Google may never find.

**What was done:**

- Landing's four conversion points (header "Get Started", hero "Create My
  Resume", mobile drawer CTA, footer CTA) all point to `/register` — a real
  route, crawlable, and the correct funnel for new users ("Get Started" ≠
  "Sign In").
- Footer links to the new `/privacy` and `/terms` pages.
- Login ↔ Register cross-link each other (already existed, kept).
- Every new page has a "Back to home" link.

**Rule going forward:** every new public page gets at least one link from an
existing page (and a sitemap entry).

---

## 18. Broken links

**What they are:** links that go nowhere — dead pages, 404s, or the
placeholder `href="#"`.

**Why they matter:** they waste crawler time, leak equity, look broken to
users, and signal an unmaintained site.

**What was fixed:** the footer had five `#` placeholders (Privacy Policy,
Terms of Service, Contact Us, Twitter, LinkedIn). Two became real pages;
Contact/Twitter/LinkedIn were **removed** rather than pointing at invented
URLs (a fake mailto or wrong social profile is worse than no link — when you
have real ones, add them back as `mailto:` and profile URLs). The desktop
nav's "Pricing" anchor scrolled to a footer containing no pricing — replaced
with an "ATS Checker" anchor to the real interactive section. The non-null
`rel="noreferrer"` on resume-template external links is already safe.

---

## 19. Mobile responsiveness

**Why it's an SEO item at all:** Google indexes **mobile-first** — it judges
your site by how it renders on a phone, regardless of what a desktop shows.

**What was verified (in a real browser at 375×812 and 1280×800):** viewport
meta present; landing hamburger drawer opens with nav + CTA; zero horizontal
overflow on landing and privacy; Login/Register collapse to a single column
below `lg`; Dashboard grids stack via `sm:`/`lg:` utilities; the Editor A4
canvas auto-fits viewport width.

**What was additionally fixed:** several utility classes used in the markup
did not exist in Tailwind and were silently doing nothing —
`slate-350/450/405/55/150/650`, `teal-450`, `border-3`, `w-5.5`, `scale-108`.
They were defined as real theme steps in `tailwind.config.js` (values matching
the nearest default Tailwind shade), so dark-mode text/hover states and the
loader border now render as designed instead of falling back to inherited
styles.

**Verify anytime:** Chrome DevTools → Toggle device toolbar → iPhone SE;
Search Console → Mobile Usability report (once traffic exists).

---

## 20. Search Console verification

**What it is:** proving to Google that you own the domain, which unlocks the
dashboard where you submit your sitemap, request indexing, and see queries,
clicks, indexing errors, and Core Web Vitals.

**Why it's the only step code can't do:** verification is bound to your
Google account.

**Exact steps** (also in `SEO-CHECKLIST.md`):

1. Go to <https://search.google.com/search-console> and sign in.
2. Add property → **URL prefix** → `https://resumecraftco.vercel.app`
   (use the exact canonical form).
3. Choose the **HTML tag** method; Google gives you a line like
   `<meta name="google-site-verification" content="TOKEN" />`.
4. Paste it into `frontend/index.html` directly under the comment that says
   `Google Search Console ownership verification`, deploy.
5. Click **Verify** back in Search Console.
6. Sitemaps → submit `https://resumecraftco.vercel.app/sitemap.xml`.
7. URL Inspection → enter `https://resumecraftco.vercel.app/` →
   **Request Indexing**.

**Expectations:** first indexing takes days to weeks. Indexed pages should be
landing, privacy, terms — the robots rules keep everything else out. Watch
Performance → Queries to see which searches show your site; that data feeds
the content plan in section 25.

---

## 21. Backlinks (off-page SEO)

**What they are:** links to your site from other websites. Google treats each
quality link as a vote of authority; without any, a new site ranks almost
nowhere no matter how perfect its on-page SEO is.

**Where the plan lives:** `BACKLINK-STRATEGY.md` — a 90-day tiered plan:
launch platforms (Product Hunt, Show HN, Reddit, dev.to), directories
(AlternativeTo, G2, free-tool lists), content-driven links (data reports,
guest posts, journalist-quote services), and partnerships (universities,
career coaches) — plus anchor-text rules (stay branded, never mass
exact-match) and the tactics that trigger penalties (buying links, link
exchanges).

**The one-line version:** earn links from sites Google already trusts, slowly
and honestly; 20–30 real links beats 500 spam links and keeps you penalty-free.

---

## 22. The critical bug that was found

Worth its own section because it silently disabled two features at once:

The original `index.html` contained:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  ...
}
<!-- Prevent Flash of Unstyled / Wrong Theme on Load -->
<script>
  (function() { ... theme code ... })();
</script>
```

The JSON-LD `<script>` was **never closed**. HTML parsing rules say a script
element ends only at the first `</script>` — which appeared much later, after
the theme code. Consequences:

1. The JSON-LD element contained JSON + an HTML comment + JavaScript source
   text → not valid JSON → **Google ignored the schema entirely.**
2. The theme-preference code was trapped as inert text inside the JSON-LD
   element → **never executed** → dark-mode users saw a white flash on every
   load, then a snap to dark.

The fix moved the theme script to the very top of `<head>` (before any
rendering decision, where flash prevention belongs) and closed the JSON-LD
block properly. Verified live: the `dark` class is on `<html>` before first
paint, and both JSON-LD blocks parse.

**Lesson:** malformed structured data fails silently — always validate with
the Rich Results Test after editing it.

---

## 23. How the SPA serves SEO tags (technical)

A React SPA renders in the browser, so SEO tags need two layers:

1. **Static layer (`index.html`):** everything crawlers and social scrapers
   see on first fetch — charset/viewport, title, description, robots,
   canonical, the full OG/Twitter set, fonts, the global JSON-LD. Social
   platforms (Facebook, LinkedIn, WhatsApp) do **not** execute JavaScript,
   so anything they must read has to live here — which is why the og tags
   describe the product, not the route.

2. **Dynamic layer (`src/components/SEO.jsx`):** a component rendered once per
   page. On mount it updates `document.title`, description, robots, canonical,
   og/twitter title+description, and optionally injects a route-scoped JSON-LD
   (`id="route-jsonld"`). Usage is one line per page:

   ```jsx
   <SEO
     title="Privacy Policy"
     description="How ResumeCraft handles your data..."
     path="/privacy"
   />
   ```

   - `noindex` → adds `<meta name="robots" content="noindex, nofollow">`.
   - `jsonLd` → writes valid JSON-LD that is removed on unmount. Ownership is
     tracked with a per-instance `Symbol` so a stale cleanup during React
     route transitions can never delete the *next* page's tags.

3. **Routing/prerendering:** Vercel's rewrite
   `/(login|register|privacy|terms|dashboard|editor|editor/:id) → /index.html`
   serves the SPA shell for deep links (so `/privacy` loads directly instead
   of 404ing). Google executes the JS and indexes the rendered result. If the
   site grows a real blog, revisit this with prerendering (e.g. `vite-plugin-ssr`
   or moving the blog to static pages) — but for the current 3 public pages,
   client rendering is fully sufficient and verified.

---

## 24. File-by-file change map

**New files:**

| File | Purpose |
|---|---|
| `frontend/public/robots.txt` | Crawl rules + sitemap pointer |
| `frontend/public/sitemap.xml` | Indexable-page list for Google |
| `frontend/public/social-preview.png` | Real og:image (1200×630, 55 KB) |
| `frontend/scripts/generate-social-preview.py` | Reproducible og:image generator |
| `frontend/src/components/SEO.jsx` | Per-route title/description/canonical/robots/JSON-LD |
| `frontend/src/pages/Privacy.jsx` | Privacy policy (indexable, E-E-A-T/trust) |
| `frontend/src/pages/Terms.jsx` | Terms of service (indexable) |
| `SEO-CHECKLIST.md` | Status table + Search Console steps |
| `SEO-GUIDE.md` | This document |
| `BACKLINK-STRATEGY.md` | Off-page link acquisition plan |

**Modified files:**

| File | Changes |
|---|---|
| `frontend/index.html` | Fixed unclosed JSON-LD; moved theme script to top of head; added robots meta, canonical, author, full OG/Twitter set with image dimensions/alt, theme-color, verification placeholder; fonts restructured (3 critical families, weights merged, async rest with noscript); schema expanded to WebApplication+Organization+WebSite |
| `frontend/src/App.jsx` | Added `/privacy` and `/terms` routes (lazy-loaded) |
| `frontend/src/pages/Landing.jsx` | SEO component + FAQPage JSON-LD; removed `@import` font; footer dead links → real routes; Pricing nav → ATS Checker anchor; CTAs → `/register`; FAQ questions wrapped in h3 with `aria-expanded`; cookie banner h4 → p |
| `frontend/src/pages/Login.jsx` | SEO component (noindex) |
| `frontend/src/pages/Register.jsx` | SEO component (noindex); aside h2 → p |
| `frontend/src/pages/Dashboard.jsx` | SEO component (noindex) |
| `frontend/src/pages/Editor.jsx` | SEO component (noindex); sr-only h1; resume-template h1/h2/h4 → styled divs; `renderSection` h3 → div with `resume-section-title` class; CSS selector updated to match |
| `frontend/tailwind.config.js` | Added missing steps: slate 55/150/350/405/450/650, teal 450, `borderWidth 3`, `spacing 5.5`, `scale 108` |
| `frontend/vercel.json` + `vercel.json` | HSTS + X-XSS-Protection headers; immutable caching for `/assets/*`; cache rules for SEO files; `/privacy` and `/terms` SPA rewrites |
| `backend/server.js` | Production HTTPS-redirect middleware (X-Forwarded-Proto aware) |

---

## 25. Maintenance routine

**After every deploy:**

- Run <https://pagespeed.web.dev> on the live URL — LCP/INP/CLS should stay
  green; the font list in `index.html` is the first thing to re-check if LCP
  regresses.

**Monthly:**

- Search Console → Performance: note which queries get impressions without
  clicks — those are pages/wording to improve.
- Search Console → Pages (indexing): confirm 3 pages indexed, no errors.
- Rich Results Test on `/`: FAQPage still valid.

**When you add a public page:**

1. Unique title + description via `<SEO />`
2. Internal link from at least one existing page
3. `<url>` entry in `sitemap.xml`
4. (If it's FAQ-style content) matching FAQPage JSON-LD

**When you get a real contact email or social profiles:** add them back to
the footer as real links (they were removed only because placeholders don't
count).

**Before any domain change:** update `SITE_URL` in `SEO.jsx`, plus URLs in
`index.html`, `robots.txt`, `sitemap.xml`, and both `vercel.json` files, and
set up 301 redirects from the old domain.
