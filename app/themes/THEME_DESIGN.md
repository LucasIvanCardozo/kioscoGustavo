# Carta QR — Theme Design System

The Carta QR frontend renders across six themes selected at runtime via the `data-theme` attribute on `<html>`. This document is the source of truth for the token vocabulary, the per-theme resolution of every token, and the rules every component must follow.

## Three-layer model

The token system has three layers. Each layer has a single responsibility. Components consume only layer 2.

```
Layer 1 — Primitives   :  --palette-* ramps in OKLch
Layer 2 — Semantic aliases :  --color-* tokens that components consume
Layer 3 — Consumers   :  CSS Modules, inline styles, theme-aware components
```

**Layer 1 — Primitives.** Pure OKLch ramps (`--palette-50` … `--palette-900`, plus `--palette-neutral-*`, `--palette-success-*`, `--palette-warning-*`, `--palette-error-*`, `--palette-info-*`). Primitives are not consumed by components. They exist so the semantic layer has a stable color space to draw from. Changing a primitive value ripples through every semantic token that references it.

**Layer 2 — Semantic aliases.** Role-named tokens (`--color-interactive`, `--color-text-primary`, `--color-error`, etc.). Each alias resolves to one primitive or a small mix. This is the only layer components are allowed to read.

**Layer 3 — Consumers.** CSS Modules and TSX that consume layer 2. They never reach back to layer 1. They never hardcode hex, rgb, or oklch.

Why three layers and not two: a component cannot decide between `--palette-500` (mid hue) and `--palette-600` (deeper hue) without leaking palette semantics into the component. Aliases give every consumer a stable role (`button`, `error`, `text-muted`) that survives a palette swap.

---

## File layout

```
app/themes/
├── themes.css            ← spacing, typography, radii, transitions, base @imports
├── theme-default.css     ← [data-theme='default'] — OKLch blue
├── theme-dark.css        ← [data-theme='dark']    — OKLch dark
├── theme-blue.css        ← [data-theme='blue']    — OKLch corporate blue
├── theme-green.css       ← [data-theme='green']   — OKLch green
├── theme-purple.css      ← [data-theme='purple']  — OKLch purple
└── theme-ficients.css    ← [data-theme='ficients']— OKLch amber on dark
```

`app/globals.css` contains only DOM base styles. It does not redeclare tokens.

---

## Token vocabulary

Tokens are grouped by role. Every role has a primary token, and most have `-hover`, `-light`, or `-inverse` companions.

### Surface

```
--color-background       page-level background
--color-surface          card, panel, modal background
--color-surface-hover    elevated surface on hover
--color-border           default border
--color-border-hover     border on hover / focus
--color-overlay          translucent dim layer for modals (alpha-baked)
```

### Text

```
--color-text-primary      body copy, headings (≥4.5:1 on surface)
--color-text-secondary    captions, helper text (≥3:1 on surface)
--color-text-muted        tertiary hints, disabled labels
--color-text-inverse      text on saturated backgrounds (primary buttons, badges)
```

### Action and brand

```
--color-interactive          primary button background, link, CTA
--color-interactive-hover    primary button hover
--color-brand                logo, brand identity, secondary surfaces
--color-brand-hover          brand on hover
```

`--color-interactive` and `--color-brand` are both chromatic. `--color-interactive` is the action color (one step higher in the ramp); `--color-brand` is the identity color. In most themes they resolve to adjacent ramps (`--palette-500` vs `--palette-600`). In `ficients` they collapse to the same hue because the brand is the chromatic anchor of the theme — see the ficients trade-off note.

### State

Each state has three tokens: the saturated `-` form, the soft `-light` form (badge background), and the `-hover` form.

```
--color-success    --color-success-light    --color-success-hover
--color-warning    --color-warning-light    --color-warning-hover
--color-error      --color-error-light      --color-error-hover
--color-info       --color-info-tint       --color-info-hover
```

### Focus

```
--color-focus-ring         translucent ring around focusable controls
--color-error-focus-ring   error-state ring around invalid controls
```

Both tokens bake alpha into the OKLch call (`oklch(58% 0.19 250 / 0.12)`). Consumers compose them via `outline` or `box-shadow`, never by mixing at the call site.

### Overlay and loading

```
--color-overlay              modal scrim, backdrop dim
--color-skeleton-base        skeleton placeholder surface
--color-skeleton-shimmer     skeleton shimmer tint
```

### Disabled

```
--opacity-disabled            fixed opacity for disabled controls (e.g. 0.5)
```

A primitive opacity rather than per-state tokens. Consumers apply `opacity: var(--opacity-disabled)` once.

### Primitives (in `themes.css`, not in theme files)

```
--space-1 … --space-12
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full
--font-size-xs … --font-size-3xl
--font-weight-*
--line-height-*
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
--transition-fast, --transition-base, --transition-slow
```

Primitives do not vary by theme. Theme files override `--shadow-*` only when the shadow is tinted with the theme hue.

---

## Per-theme resolution

Same tokens, same role, different values per theme. Components consume the token; the token resolves per theme.

| Token                  | default   | dark      | blue      | green     | purple    | ficients  |
| ---------------------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `--color-background`   | N-50 L99  | N-950 L8  | N-50 L99  | N-50 L99  | N-50 L99  | N-950 L8  |
| `--color-surface`      | N-100 L96 | N-900 L14 | N-100 L96 | N-100 L96 | P-100 L94 | N-900 L14 |
| `--color-text-primary` | N-900 L15 | N-100 L94 | N-900 L14 | N-900 L15 | N-900 L15 | N-100 L94 |
| `--color-interactive`  | P-500 L58 | P-500 L68 | P-500 L58 | P-500 L58 | P-500 L58 | P-500 L75 |
| `--color-brand`        | P-600 L50 | P-600 L58 | P-600 L50 | P-600 L50 | P-600 L50 | P-500 L75 |
| Brand hue (°)          | 250       | 250       | 245       | 145       | 285       | 80 (amber)|

`N-*` denotes `--palette-neutral-*`. `P-*` denotes `--palette-*` (the chromatic brand ramp). `L` denotes the OKLch lightness percentage.

### Why lightness values flip in dark themes

Light themes surface at L≈96 and text at L≈15 (low L on high L). Dark themes invert: surface at L≈14, text at L≈94 (high L on low L). Hover direction also flips:

- Light themes: `--color-interactive-hover` resolves one step **darker** (palette-600, L=50) so the button visibly deepens.
- Dark themes: `--color-interactive-hover` resolves one step **lighter** (palette-400, L=75) so the button visibly brightens.

This is the OKLch-derived perceptual rule: hover always moves the button away from the surface, never into it.

### State badges in dark themes

The `-light` state tokens are used as badge backgrounds. Light themes resolve them to high-L OKLch (~92%) on neutral-100 surfaces. Dark themes resolve them to **dark-L** OKLch (~30%) on neutral-900 surfaces — the L direction inverts to maintain contrast. For example:

- Default: `--color-info-tint` → `--palette-info-100` (oklch 94% 0.04 200) — soft sky on white.
- Dark: `--color-info-tint` → `--palette-info-100` (oklch 30% 0.08 200) — dark teal on near-black.

The ramp is redefined per theme so the perceptual role of "soft state background" is preserved.

### Why `--color-brand` is chromatic in every theme

In `ficients`, the surface is intentionally dark, but the brand identity is the amber accent. `--color-brand` therefore resolves to `--palette-500` (oklch 75% 0.19 80, the chromatic ramp), not to a neutral surface. This keeps brand identity distinct from background tone across all six themes.

---

## The contract

Every theme exposes the same semantic tokens with the same role. The only thing that varies is the value behind each token. This means:

- A component that consumes `--color-text-primary` renders correctly in every theme.
- A component that consumes `--color-interactive` is themable for free.
- A component that hardcodes `#3b82f6` breaks the contract and ships a bug.

The contract is enforced by convention: code review rejects hex, rgb, oklch, and `--palette-*` reads inside `components/`, `app/`, and `lib/`.

---

## Status badges

The `<Badge>` component (`components/UI/Badge/Badge.tsx`) is the only sanctioned way to render status, type, or category indicators. Seven parallel implementations existed before the refactor; this section codifies the canonical pattern so new surfaces cannot regress.

### API

```tsx
<Badge
  tone="success | warning | danger | info | neutral"
  shape="pill | compact"            // default 'pill'
  icon?: ReactNode                  // decorative; rendered with aria-hidden="true"
  ariaLabel?: string                // when set, applies role="img" + aria-label
>
  Label text
</Badge>
```

`icon` accepts any `ReactNode` — `<FontAwesomeIcon icon={faX} />`, a custom `<svg>`, an emoji, etc. The wrapper always marks the icon as decorative because the visible text carries the label.

### The five tones

Tones are role-named, not color-named. Consumers pick the role; the theme resolves the color.

| Tone     | When to use                                                       |
| -------- | ----------------------------------------------------------------- |
| success  | Completed, active, available, paid, accepted, current.            |
| warning  | Pending attention, awaiting action, "En uso", "Esperando pedido". |
| danger   | Errors, cancelled-with-action-required, occupied, rejected, not-paid. |
| info     | In progress, upcoming, informational ("Nuevo", "Promo").          |
| neutral  | Terminal states with no action required (cancelled, expired, inactive, "Desactivada"). |

The `danger` tone uses `--color-error-light` / `--color-error` under the hood — the theme family is destructive, but the API uses the role name `danger` so consumers don't reason about color.

### The two shapes

| Shape    | Where to use                                               |
| -------- | ---------------------------------------------------------- |
| `pill`   | Cards, modals, dashboards, dense visual surfaces. Default. |
| `compact` | Table cells, inline indicators, dense lists.              |

`pill` uses `var(--radius-full)` and `--space-1` × `--space-3` padding. `compact` uses `var(--radius-sm)` and tighter padding. Both share font-size `--font-size-xs`.

### The pattern: light background + state text

The documented badge pattern is:

```css
background-color: var(--color-{state}-light);
color: var(--color-{state});
```

This pairs a desaturated background tint with the saturated state color for text. Both elements come from the same state family, so contrast is consistent across themes and verified WCAG-AA in `themes.css`. **Do not use the inverse pattern** (saturated background + `--color-text-inverse` text) — it was the old `TableStatusBadge` pattern and was retired in the Bloque 4 refactor.

### Canonical mappings

Tone selection must come from the canonical mapping tables in `lib/shared/utils/statusVariant.ts`. Never pick a tone ad-hoc.

```ts
ORDER_STATUS_VARIANT      // pending→warning, paid→success, not_paid→danger, ...
TABLE_STATUS_VARIANT      // available→success, occupied→danger
TABLE_STATUS_ICON         // available→faCheck, occupied→faXmark
TABLE_STATUS_LABEL        // available→"Libre", occupied→"Ocupada"
REQUEST_STATE_VARIANT     // pending→warning, accepted→success, rejected→danger
REQUEST_TYPE_VARIANT      // call→warning, check→success, order→info
REQUEST_TYPE_ICON         // call→faBell, check→faClock, order→faReceipt
REQUEST_TYPE_LABEL        // call→"Llamada al mozo", check→"Pedido de cuenta", order→"Pedido"
PROMOTION_STATUS_VARIANT  // active-now→success, upcoming→info, expired→neutral, disabled→danger
INVITATION_STATUS_VARIANT // pending→warning, accepted→success, expired→neutral, cancelled→danger
ACTIVE_STATE_VARIANT      // active→success, inactive→neutral, deleted→danger
```

Every entity in the codebase that exposes a status has a mapping here. To add a new entity, add its `Record<EntityType, StatusTone>` mapping here first, then consume it from the surface — never inline a tone literal in a component.

### Anti-patterns

- **No `<span>` with manual CSS classes that mimic a badge.** If you need a badge-like indicator, use `<Badge>`.
- **No ad-hoc tone selection.** Don't write `tone={status === 'paid' ? 'success' : 'warning'}` — write `tone={ORDER_STATUS_VARIANT[status]}`.
- **No labels hardcoded next to `<Badge>`.** If a status needs a localized label, add it to the corresponding `*_LABEL` map in `statusVariant.ts`.
- **No new `--color-*` tokens for badges.** The five tones map onto the existing state-token family. Adding a sixth tone breaks the contract and the WCAG matrix.

---

## Palette primitives

Every theme defines these ramps in OKLch:

```
--palette-50 … --palette-900       chromatic brand ramp
--palette-neutral-50 … --palette-neutral-900   neutral surface/text ramp
--palette-success-100/400/500/600 state ramps
--palette-warning-100/400/500/600 state ramps
--palette-error-100/400/500/600   state ramps
--palette-info-100/400/500/600    state ramps
```

The chromatic ramp is the theme's hue anchor: default/blue/dark sit at hue 245–250 (blue), green at 145, purple at 285, ficients at 80 (amber).

`--palette-info-*` is intentionally a separate ramp from `--palette-success-*`. Info carries the "neutral notification" role; collapsing it into brand would break cross-theme parity for messages and links.

Per-theme palette overrides exist for the state ramps because each theme needs state colors that read on its specific surface. They are not dead code — they are the foundation of cross-theme contrast.

---

## WCAG matrix

Verified contrast ratios for the text tokens against `--color-surface`. WCAG AA requires ≥4.5:1 for normal text and ≥3:1 for large text.

| Theme     | text-primary / surface | text-secondary / surface |
| --------- | ---------------------- | ------------------------ |
| default   | 12.5:1 ✓               | 5.2:1 ✓                  |
| dark      | 12.3:1 ✓               | 5.1:1 ✓                  |
| blue      | 13.1:1 ✓               | 5.4:1 ✓                  |
| green     | 12.8:1 ✓               | 5.0:1 ✓                  |
| purple    | 11.9:1 ✓               | 4.8:1 ✓                  |
| ficients  | 14.2:1 ✓               | 6.1:1 ✓                  |

All six themes clear AA for normal body text on surface. State tokens clear AA against `--color-{state}-light` in their respective themes.

---

## Rules for new code

1. **Consume semantic aliases only.** Never write `var(--palette-*)` in a component CSS Module. If a role is missing, add it to all six themes first, then consume it.
2. **No color literals in components.** Zero hex (`#fff`), zero rgb (`rgb(...)`), zero oklch (`oklch(...)`) inside `components/`, `app/`, or `lib/`. Theme files own OKLch; component code reads tokens.
3. **Pick the role-aligned token.** Text uses `--color-text-*`. Actions use `--color-interactive` or `--color-brand`. States use `--color-{success|warning|error|info}`. A link inside an error banner reads `--color-text-primary` on `--color-error-light`, not `--color-error`.
4. **New tokens ship in all six themes.** A token defined in one theme is undefined in the others and resolves to nothing — silent failure. Always edit the six theme files atomically.
5. **Hover L direction is theme-aware.** Do not write a literal `filter: brightness(...)` for hover. Use the `-hover` companion token, which already encodes the right L delta.
6. **Disabled state uses `--opacity-disabled`.** Do not redefine `opacity: 0.5` per component. The single primitive keeps disabled appearance consistent.

---

## Adding a new theme

1. **Copy the template.** Start from `theme-default.css` (light) or `theme-dark.css` (dark). Rename and place under `app/themes/`.
2. **Pick a brand hue.** Decide the chromatic identity (e.g. 30 for terracotta). Rewrite every `--palette-*` value with the new hue. Use the same chroma profile as the closest sibling theme.
3. **Adjust neutral ramp.** Light themes keep neutral at hue 250 with low chroma. Dark themes invert L direction so surface/text reads on a dark background.
4. **Rewrite state ramps.** Each state ramp may need a hue shift to read on the new surface. Verify with the WCAG matrix below.
5. **Set hover direction.**
   - Light themes: `-hover` resolves one step deeper in the ramp (e.g. palette-600 if interactive is palette-500).
   - Dark themes: `-hover` resolves one step lighter in the ramp (e.g. palette-400 if interactive is palette-500).
   - This is the OKLch-derived rule: hover moves the surface away from its background.
6. **Wire it in.** Add `@import './theme-newtheme.css';` to `themes.css` and add the matching value to the `data-theme` selector list wherever themes are documented.
7. **Verify WCAG.** Compute contrast for text-primary / surface and text-secondary / surface. Update this document's matrix.

---

## Migration history

Legacy alias names were removed in a single pass:

| Legacy                       | Canonical                              |
| ---------------------------- | -------------------------------------- |
| `--color-primary`            | `--color-interactive`                  |
| `--color-primary-hover`      | `--color-interactive-hover`            |
| `--color-secondary`          | `--color-brand`                        |
| `--color-secondary-hover`    | `--color-brand-hover`                  |
| `--color-accent`             | `--color-info`                         |
| `--color-accent-hover`       | `--color-info-hover`                   |
| `--color-focus-ring-error`   | `--color-error-focus-ring` (removed earlier) |
| `--color-primary-contrast`   | `--color-text-inverse`                 |

Consumers were migrated to canonical names in the same pass. Theme files no longer carry any legacy alias declarations. The `--color-focus-ring-error` alias was already removed in a prior lot because it had zero consumers.

---

## Trade-off notes

**Why info has its own family, separate from brand.** Brand is identity (logo, primary CTA). Info is a notification channel (toasts, helper text, informational badges). Conflating them meant every "info" surface accidentally took on brand identity and clashed with cross-tenant layouts where brand and info differ. Splitting them lets a theme recolor brand without disturbing info and vice versa.

**Why brand is chromatic in `ficients` (not a neutral surface).** The brand identity of `ficients` is the amber accent. Resolving `--color-brand` to a neutral surface would erase that identity and reduce the theme to "dark mode with a button color." The chromatic brand ramp gives the logo, secondary surfaces, and badges a recognizable anchor that survives background changes.

**Why hover L direction flips per mode.** On a light surface, deepening a button (lower L) is visually obvious against a higher-L background. On a dark surface, deepening a button (lower L) makes it disappear into the surface. Dark themes therefore lighten the hover step. The semantic token `--color-{role}-hover` encodes this rule once, so consumers don't have to think about L direction.

**Why `color-mix(in oklch, var(--color-X) X%, transparent)` instead of `oklch(var(--color-X) / α)`.** The semantic tokens are not stored as bare OKLch components — they are full OKLch calls including their own alpha (e.g. `--color-focus-ring: oklch(58% 0.19 250 / 0.12)`). Stripping the alpha to recompose it would require duplicating the lightness/chroma/hue at every call site. `color-mix` with `transparent` composes alpha at the call site against the already-baked token and works in every modern browser. The trade-off is one indirection per usage; the win is no duplication.
