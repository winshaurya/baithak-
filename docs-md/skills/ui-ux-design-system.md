# UI/UX Design System Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/toss-style-design-system.mdc) (Toss-Style Design System Standards).

## Purpose & Scope
This skill governs user interface hierarchy, typography, disciplined spacing, grayscale contrast, accessibility (WCAG AA), and ergonomic interaction design across Baithak.

---

## 1. Design Direction
- Build quiet, high-trust product UI with clear hierarchy, generous spacing, and minimal ornament.
- Use one primary accent color and rely on grayscale for most structure.
- Avoid decorative gradients, unnecessary shadows, and competing accent colors.
- Prioritize readability, confidence, and fast scanning over visual novelty.

## 2. Typography
- Use a strict type scale with clear roles for page title, section title, body, supporting text, and metadata.
- Use font weight and color before using large size changes.
- Never use pure black text: use a dark grayscale foreground (e.g. `slate-900`, `slate-700`).
- Keep line height comfortable for body copy and tighter for short labels or metrics.
- For metrics, make the number visually dominant and the unit smaller but still legible.

## 3. Layout and Rhythm
- Use consistent spacing tokens (`px-4`, `py-2`, `gap-3`, `gap-6`).
- Keep related content close and unrelated content separated by whitespace.
- Use section rhythm: summary, details, action, and supporting context.
- Align form fields, values, and controls predictably.
- Avoid nested cards and excessive borders.

## 4. Cards and Surfaces
- Use cards only for grouped content that needs a surface.
- Keep card radius restrained and consistent (`rounded-xl` or `rounded-lg`).
- Use subtle shadows or borders, not both heavily (`border border-slate-200 bg-white shadow-sm`).
- Keep shadow opacity low and avoid dramatic elevation.
- Do not place important controls in low-contrast decorative surfaces.

## 5. Color Discipline
- Use the accent color for primary actions, selected state, links, or critical brand moments.
- Use semantic colors for status only: success (green), warning (amber), error (red), and information (blue).
- Keep disabled and secondary states in grayscale (`slate-400`, `slate-100`).
- Ensure status is never communicated by color alone (always combine icon, badge text, or tooltip).

## 6. Accessibility & Touch Ergonomics
- Meet WCAG AA contrast for text and controls.
- Provide visible focus states (`focus-visible:ring-2 focus-visible:ring-slate-900`).
- Keep tap targets large enough for touch (minimum 44x44px for primary interaction buttons).
- Use semantic HTML (`<main>`, `<nav>`, `<button>`, `<section>`, `<article>`) and labels before adding ARIA.
- Respect reduced motion preferences.

## 7. Common Anti-Patterns to Prevent
- Do not create one-off spacing values (`h-[137px]`).
- Do not mix multiple unrelated accent colors.
- Do not overuse cards to separate every piece of content.
- Do not rely on large hero typography inside dense product screens.
