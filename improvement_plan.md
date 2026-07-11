# Saarathi Frontend — Full Redesign Plan

## Context

`saarathi-frontend` is the UI for an Expedia hackathon entry ("Saarathi", pitch-named "Threshold" in the planning docs): an AI flight-decision assistant that doesn't just rank flights — it takes one confident position (a "verdict"), defends it with evidence, shows what you're giving up by not picking alternatives, and — the flagship differentiator — computes exact **counterfactuals**: "United 88 wins if its fare drops below $543" / "you accept one stop." All of this is backed by a deterministic, invertible scoring function in the NestJS backend; an LLM only phrases the explanation prose, never ranks or decides.

The app currently exists as a single working page (`app/page.tsx`) implementing this as six dense zones on a dark "Bloomberg Terminal" navy theme, built deliberately minimal per `plan/product_spec_v2.md` / `saarathi/docs/architecture_v2.md` — those docs explicitly say **"one page… do not add routes"** and explicitly **deprioritize maps** ("cut from the critical path... only if hours remain, last priority"), because the hackathon deadline (Jul 12, 11:45 PM IST) is close and the toolkit FAQ says *"a polished UI is not mandatory."*

**You've explicitly chosen to override both of those calls** — full multi-route redesign, real map, no scope-cutting — after being told about the tension. This plan proceeds on that basis. Every place it departs from the original docs is marked **[DEPARTURE]** so it stays traceable, not because it's being second-guessed.

I also checked sarvam.ai directly rather than relying on memory: it is **light-mode-first** — warm off-white background, near-black ink, a single restrained gradient accent, flat cards with hairline borders, generous whitespace, confident sans headlines. That's the opposite of the app's current dark navy palette, so the design-token rewrite below replaces dark-as-default with light-as-default, while preserving the original spec's "Bloomberg terminal" *density* (mono numerals, tight rows, tabular precision) inside the Decision Screen specifically — through typography and layout density, not a dark background.

**Confirmed scope decisions:**
1. Full send — build the complete multi-route, map-rich redesign as one effort, not phased/cuttable.
2. Map: a real basemap via **MapLibre GL JS + MapTiler** (you'll need to grab a free MapTiler API key and add `NEXT_PUBLIC_MAPTILER_KEY` to `.env.local` — I can't sign up for that on your behalf).
3. Backend (`saarathi-backend`) is untouched — this is a frontend-only redesign consuming the existing two endpoints (`GET /api/users`, `POST /api/recommend`) as-is.
4. Prefer ready-made libraries over hand-built components everywhere possible (shadcn/ui, MapLibre, Recharts, react-hook-form, etc.) — the only "custom" pieces are thin composition/primitives, consistent with how the project already works.

---

## Information architecture — 8 routes

```
app/
  page.tsx                              "/"                      marketing landing        [NEW]
  layout.tsx                            root layout: fonts, providers                       [REBUILD]
  (product)/
    layout.tsx                          shared shell for everything under /app              [NEW]
    app/page.tsx                        "/app"                   single-leg composer        [NEW]
    app/multi-city/page.tsx             "/app/multi-city"        multi-city composer        [NEW]
    app/decision/page.tsx               "/app/decision"          the flagship six-zone screen [REBUILD, was "/"]
    app/travelers/page.tsx              "/app/travelers"         traveler directory         [NEW]
    app/travelers/[userId]/page.tsx     "/app/travelers/[userId]" traveler profile + radar   [NEW]
    app/compare/page.tsx                "/app/compare"           2-traveler side-by-side    [NEW]
    app/how-it-works/page.tsx           "/app/how-it-works"      pipeline storytelling      [NEW]
```

Every route is justified against data the backend actually returns — nothing here is a fabricated feature:

| Route | Backend call(s) | Why it's real |
|---|---|---|
| `/` | none, or 1× seeded `POST /api/recommend` for a hero stat | Marketing chrome; any number shown must be server-fetched, not hardcoded. |
| `/app` | `GET /api/users` | This is today's `Header.tsx` traveler-picker + request textarea, promoted to its own screen. |
| `/app/multi-city` | `GET /api/users` | The backend already accepts `cities: string[]` as an alternate mode — this gives that existing param a dedicated ordered-chip-builder UI. |
| `/app/decision` | `POST /api/recommend`, keyed off URL query params | Today's `/` content, made deep-linkable. |
| `/app/travelers` | `GET /api/users` | Direct listing of the only user endpoint. |
| `/app/travelers/[userId]` | `GET /api/users` + one seeded `POST /api/recommend` | `InferredPreference` (weights, evidence) only exists in a `/api/recommend` response, never in `/api/users` — so the profile page needs one seeded call (using the existing `BENCHMARK_QUERIES` per-user seed requests already in `lib/store.ts`) to have real radar-chart numbers. **This extra call is disclosed in-UI** ("computed from a representative sample request"), not presented as the user's live intent. |
| `/app/compare` | 2× the above, in parallel | Same grounding, doubled. |
| `/app/how-it-works` | 1× server-side `POST /api/recommend` for a fixed benchmark (U01) | Walks the real 7-stage `trace[]` payload for that one call, not an invented pipeline diagram. |

**`/app/decision` query-param contract** (this is what makes it a real shareable deep link, not just a route that happens to exist):
```
/app/decision?userId=U01&requestText=...&destination=NRT&pts=<url-encoded JSON Perturbation[]>&leg=0
```
`userId` + `requestText` required; `destination` XOR `cities` (comma-separated); `pts` = staged perturbations; `leg` = selected leg index in multi-city mode. Every chip tap / leg tap updates these via `router.replace()` (not `push`, so back-button isn't spammed) — TanStack Query's cache key is the URL, so reloading the same link reproduces the same state without a network round-trip if cached.

---

## Design system

### Tokens — `app/globals.css` rewrite

**[DEPARTURE from architecture_v2.md §6.2's "dark tokens unchanged"]** Light becomes default; dark navy becomes an opt-in `.dark` variant via `next-themes` (cheap to keep given the existing CSS-variable architecture, good polish).

- Primitives: `paper-50/100/200` (warm off-white base/surface/hairline, e.g. `#FBF9F5` / `#F5F1E9` / `#EBE4D6`), `ink-950/700/400` (near-black text down to placeholder gray), `line-200` hairline border, `brand-600/400` (terracotta→amber two-stop gradient — amber ties back to the existing Expedia accent), darker `signal-positive`/`signal-negative` green/red re-tuned for contrast on a light background (the current `#3DDC97`/`#E2695B` are too low-contrast on white).
- Semantic tokens keep their **existing names** (`--bg-base`, `--bg-surface`, `--text-primary`, `--accent`, etc.) so every component that already consumes them needs zero prop-level changes — only the values they resolve to change. `.dark { ... }` mirrors today's navy values verbatim as the alternate theme.
- Fonts: `Inter` (body), `Fraunces` (display/headlines), `JetBrains Mono` (all prices/times/scores/thresholds — carried forward unchanged from the original spec's "Bloomberg-density is typographic" rule, still true under the light theme).
- The Decision Screen keeps its density identity via a `data-density="terminal"` attribute + tighter Tailwind variants (smaller row height, tighter leading) rather than via a dark background — marketing pages stay spacious, the Decision Screen stays dense, same token/primitive system underneath both.

### `app/layout.tsx` — fixes a real existing bug

Today it still loads stale `Geist`/`Geist_Mono` from create-next-app boilerplate and never applies the `Inter`/`Fraunces`/`JetBrains Mono` already declared in `globals.css`. Rebuild to load the three fonts via `next/font/google`, wrap children in a `next-themes` `ThemeProvider` (`defaultTheme="light"`) and a new `QueryProvider` (TanStack Query), and fix the stale `"Create Next App"` metadata title.

### Primitives — extend `components/ui/primitives.tsx` (don't fork it)

Add to the existing `Container, Stack, Text, Card, Badge, Skeleton, EmptyState, Clickable`:
- `Section` — scroll-section wrapper with spacing variants, for marketing/how-it-works pages.
- `Grid` — CSS grid wrapper (replaces ad-hoc `grid grid-cols-*` scattered in current code).
- `Prose` — long-form article typography, for marketing/how-it-works copy.
- `GradientMotif` — the *one* gradient accent primitive (`variant: "hero" | "corner"`), centralized so sarvam's "used sparingly" restraint doesn't turn into gradients-everywhere.
- `Field` — labeled form-field wrapper for the new composer forms.
- `NavLink` — active-state-aware nav link for the new top nav.

### ESLint scope — widen, don't relax

The existing `react/forbid-elements` rule (no bare `<div>/<p>/<button>`) already covers `app/**/*.tsx` (so all 8 new route files are covered automatically). It needs to be **added** to `components/marketing/**`, `components/map/**`, `components/charts/**`, `components/travelers/**`, `components/compare/**` — five new component directories that would otherwise silently bypass the house convention.

---

## New dependencies

**Raw installs:** `motion`, `maplibre-gl` + `react-map-gl`, `recharts`, `react-hook-form` + `@hookform/resolvers`, `next-themes`.

**shadcn CLI**: `dialog`, `tabs`, `command` (+`cmdk`), `calendar` (+`react-day-picker`), `chart`, `carousel` (+`embla-carousel-react`), `sonner`, `select`/`popover`/`separator`.

**Already installed, now activated:** `@tanstack/react-query`, `zod`.

---

## Data layer changes

- `lib/env.ts`, `lib/api.ts`, `lib/queries.ts` (TanStack Query hooks — the URL is the cache key).
- `lib/store.ts` reduced to pure UI state (staged perturbations, command palette, compare selection).
- `lib/data/airport-coordinates.ts` — static lookup for the 35 IATA codes present in the flights dataset (no geo-coordinates exist in the provided data), sourced from public airport data, committed as a static asset — not a live external API call.

---

## Component inventory (highlights)

Decision Screen zone components rebuilt in place (`VerdictCard`, `EvidencePanel`, `OpportunityCostPanel`, `CounterfactualPanel`, `RankedList`, `TraceBar`, `ItineraryTimeline`), plus new indicator components (`PreferenceRadar`, `ConfidenceGauge`, `ScoreBreakdownBars`) and a new `RouteMap` (MapLibre + MapTiler). New route-specific components for marketing, composer, travelers, and compare screens — see full detail in the plan history.

---

## Build sequence

1. Foundation — tokens, fonts, primitives, ESLint scope.
2. Data layer — env, api client, TanStack Query, reduced store, airport coordinates.
3. Shell/routing skeleton — all 8 routes reachable.
4. Decision Screen rebuild — the flagship (map + indicators first, then zones).
5. Composer routes.
6. Remaining routes — travelers, compare, landing, how-it-works.
7. Polish — motion, responsive, dark mode, accessibility.

---

## Verification

Run backend + frontend dev servers concurrently throughout — no mocked data. `npm run lint` / `npm run build` after major phases. Manual click-through of all 8 routes, counterfactual chip flips, deep-link reload test, dark-mode toggle, mobile width, and the MapTiler-key-unset fallback.

---

## Out-of-scope observations

- `.env.local` contains a `GROQ_API_KEY` that appears unused by the frontend (Groq is only called from the NestJS backend) — worth removing/rotating.
- Backend CORS is wildcard-open with no auth — fine for a hackathon demo, unchanged by this frontend-only plan.
