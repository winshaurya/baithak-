# Next.js App Router Architecture Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/nextjs-app-router-cursorrules-prompt-file.mdc) and Next.js Official Architecture Standards.

## Core Architectural Principles
- **Server Components by Default:** All components in `src/app/` are React Server Components (RSC) unless interactive browser state is explicitly required.
- **Client Component Leaf Isolation:** Use `'use client'` strictly at leaf nodes (audio recorders, waveform visualizers, picture-in-picture floating controllers). Never mark root pages or layouts as client components unless the entire view is client-state driven.
- **Data Fetching:** Fetch server-side data directly inside Server Components using standard async/await. Avoid `useEffect` for data loading.
- **Route Handlers:** API routes reside in `src/app/api/**/route.ts`. Use standard Web API `Request` and `Response` interfaces.

---

## Folder Hierarchy & Conventions
- `src/app/layout.tsx`: Root HTML shell with typography and global metadata.
- `src/app/page.tsx`: Main application entry point.
- `src/app/loading.tsx`: Streaming suspense skeletons for route transitions.
- `src/app/error.tsx`: Client-side error boundaries for route-level fault tolerance.
- `src/app/not-found.tsx`: Clean 404 handler.
- `src/app/api/`: Serverless HTTP endpoints.
- `src/components/`: Reusable presentation and interaction components.
- `src/lib/`: Pure domain logic, validation schemas, database layers, and provider clients.

---

## Performance & Rendering Rules
1. **Partial Prerendering (PPR) & Streaming:** Wrap dynamic asynchronous components in `<Suspense fallback={<Skeleton />}>` to enable immediate streaming of static shells.
2. **Turbopack Compatibility:** Ensure file paths for filesystem access are static or annotated with `/*turbopackIgnore: true*/` to avoid lambda tracing bloat.
3. **Asset Optimization:** Use Next.js native font loaders (`next/font`) and static asset routing in `public/` for low-latency delivery across global edge CDNs.
4. **Environment Variables:**
   - Server-only variables (`GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`) must never be prefixed with `NEXT_PUBLIC_`.
   - Client-accessible variables require the explicit `NEXT_PUBLIC_` namespace.
