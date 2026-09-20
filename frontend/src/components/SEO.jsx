import { useEffect, useRef } from 'react';

export const SITE_URL = 'https://resumecraftco.vercel.app';

const DEFAULT_TITLE = 'Free AI Resume Builder & ATS Score Checker — ResumeCraft';
const DEFAULT_DESCRIPTION =
  'ResumeCraft is a free AI-powered resume builder: parse your resume with Gemini AI, style every pixel, score it against any job description with a real-time ATS checker, and export a print-ready single-page PDF.';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/**
 * Per-route document head management for the SPA.
 *
 * Updates title, description, robots, canonical and social tags on mount.
 * `jsonLd` (object or array of objects) is written to a route-scoped
 * <script type="application/ld+json" id="route-jsonld"> node that is removed
 * when this page unmounts, so structured data always matches visible content.
 */
export default function SEO({ title, description, path = '/', noindex = false, jsonLd = null }) {
  // Stable per-instance owner tag so a stale cleanup can never remove the
  // node the newly mounted page just wrote.
  const ownerRef = useRef(Symbol('seo'));

  useEffect(() => {
    const fullTitle = title ? `${title} | ResumeCraft` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = `${SITE_URL}${path === '/' ? '/' : path}`;
    const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', robots);
    upsertCanonical(canonicalUrl);

    // Keep social tags in sync with the current route.
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);

    // Route-scoped JSON-LD (e.g. FAQPage for the landing page).
    const existing = document.getElementById('route-jsonld');
    if (jsonLd) {
      const script = existing || document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'route-jsonld';
      script.dataset.owner = String(ownerRef.current);
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      script.textContent = JSON.stringify(
        items.length === 1 ? { '@context': 'https://schema.org', ...items[0] } : { '@context': 'https://schema.org', '@graph': items }
      );
      if (!existing) document.head.appendChild(script);
    } else if (existing && existing.dataset.owner === String(ownerRef.current)) {
      existing.remove();
    }

    return () => {
      const stale = document.getElementById('route-jsonld');
      if (stale && stale.dataset.owner === String(ownerRef.current)) {
        stale.remove();
      }
    };
  }, [title, description, path, noindex, jsonLd]);

  return null;
}
