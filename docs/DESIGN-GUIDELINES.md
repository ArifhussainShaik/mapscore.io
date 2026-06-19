# Mapscore Design Guidelines

> The durable design reference for the agency platform. Every phase's UI follows
> this. Source of the tokens: a 5-agent competitor + best-practice research pass
> (Linear, Vercel, Stripe; Local Falcon, BrightLocal, Whitespark, Localrank.so).

## Design principle: aggressive restraint

Near-monochrome neutrals, **one** accent (indigo), tight radii, 1px borders over
heavy shadows, typography does the work, semantic colors muted. The rank
green→red scale is **reserved exclusively for ranking semantics** so it never
competes with brand color. The category is visually weak — polish is the wedge.

## Tokens

### Neutrals (zinc)
```
50  #FAFAFA   100 #F4F4F5   200 #E4E4E7   300 #D4D4D8   400 #A1A1AA
500 #71717A   600 #52525B   700 #3F3F46   800 #27272A   900 #18181B   950 #09090B
```

### Primary (indigo — avoids default-blue / default-daisy-purple)
```
50 #EEF2FF   500 #6366F1   600 #4F46E5
```

### Semantic (muted, not neon)
```
success #16A34A   warning #D97706   error #DC2626   info #2563EB
```

### Type
- Font: **Inter** (via `next/font`), `--font-sans`.
- Body **14px/20px** (dense — NOT 16px).
- Page title 24px / 600. KPI number 30px / 700.
- Tabular numbers **on** (`font-feature-settings: "tnum" 1`).

### Spacing / radius / shadow
- 4px grid. Card padding 16–24. Table cell 8×12.
- Radius: field **6px** · box **8px** · pill 9999px. Avoid 16px+.
- Shadow: cards = 1px border + xs shadow. Real shadow only on menus/modals/toasts.

## DaisyUI de-defaulting (critical)

Default DaisyUI looks like a demo. The custom `agency` theme MUST set:
```
--depth: 0;   /* removes fake 3D */
--noise: 0;   /* removes texture */
```
plus indigo primary, tight radii, 1px border. Without these the product reads as
a generic admin template.

## Rank color ramp (shared: heatmap + reports)

Single source of truth: `libs/rankColor.js`. Colorblind-safe diverging ramp
(ColorBrewer RdYlGn-derived), monotonic in lightness so it survives
deuteranopia/protanopia + grayscale.

```
1–3   #1A9850 (Top)     4–6   #A6D96A     7–10  #FEE08B
11–15 #FDAE61           16–20 #F46D43     not found / >20  #A50026
```

**Always pair the color with the printed rank number — never color alone.**

## Dashboard UX rules

- Sidebar IA: **≤2 clicks** to any task. Grouped nav (Overview / Workspace / Settings).
- **Cmd+K** command palette everywhere.
- Consistent page header: breadcrumb → H1 → optional description, action right.
- Tables: dense, 1px dividers, **no zebra**, sticky header, row hover, right-align numerics.
- KPI cards: flat, bordered, no gradient.
- **Designed empty states** (never a blank dashboard) — the empty state IS onboarding.
- **Skeletons, not spinners**, for loading.
- Toasts bottom-right.

## CTA standards

- Primary button **48px**, `btn btn-primary`, **one per view**, ≥4.5:1 contrast.
- 6 states (default/hover/active/focus/disabled/loading).
- Value-verb microcopy: "Run my free scan", "Add location" — not "Submit".
- Loading state shows spinner + verb ("Scanning…").
- Secondary actions: `btn-ghost` / `btn-outline`.

## White-label report structure

Client-facing report, **zero Mapscore branding**:
1. TLDR sentence (plain-language summary).
2. Hero KPIs.
3. Before/after grid (the closed-loop proof).
4. Competitors.
5. 3–5 prioritized recommendations.

## Cheap / dated mistakes to avoid

- Default DaisyUI purple, big radii, depth, noise.
- Default-blue everything.
- 16px+ body text and oversized cards (looks like a template).
- Heavy drop shadows / gradients on cards.
- Zebra-striped tables.
- Blank dashboards and spinner-only loading.
- Rank color used decoratively (dilutes its meaning).
- Color-only signaling (accessibility fail).

## Research sources

- Linear, Vercel, Stripe (restraint, density, typography).
- Local Falcon (pretty-but-narrow), BrightLocal ("legacy tools in a new
  wrapper", excessive clicks), Whitespark (polish, tracking-only),
  Localrank.so (grid pricing reference).
- ColorBrewer RdYlGn (colorblind-safe diverging ramp).
