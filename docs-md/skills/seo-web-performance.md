# SEO & Web Performance Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/cursorrules-cursor-ai-nextjs-14-tailwind-seo-setup.mdc) and Google Search Central Guidelines.

## Purpose & Scope
This skill defines metadata architecture, OpenGraph and Twitter card rendering, sitemap automation, and Core Web Vitals optimization.

---

## 1. Metadata Architecture
- **Root Layout Metadata:** Provide complete meta tags in `src/app/layout.tsx`:
  - Concise title template (`%s | Baithak`)
  - Semantic description highlighting the product value proposition
  - Canonical URL (`metadataBase: new URL('https://baithak.winnn.me')`)
  - Target keywords: `AI Notetaker, Meeting Transcription, Action Items, Executive Summary, Speech to Text`
- **Social Sharing (OpenGraph & Twitter):**
  - High-resolution summary large image cards
  - Dedicated locale and site name specifications

---

## 2. Crawler Automation
- **Sitemap Generator:** Dynamic `src/app/sitemap.ts` exporting canonical endpoints, change frequencies, and priority weights.
- **Robots.txt Generator:** `src/app/robots.ts` declaring explicit user-agent permissions and pointing indexers to the dynamic XML sitemap.
- **Web App Manifest:** `src/app/manifest.ts` providing full Progressive Web App (PWA) manifest support for standalone mobile installation.

---

## 3. Core Web Vitals Optimization
- **Largest Contentful Paint (LCP):** Pre-render static shells and load hero typography via `next/font/google` with `display: swap`.
- **Cumulative Layout Shift (CLS):** Reserve explicit dimensions for waveforms and control containers to prevent visual layout shifts during state transitions.
- **Interaction to Next Paint (INP):** Decouple expensive audio decoding from the main browser thread; use lightweight Canvas render loops with `requestAnimationFrame`.
