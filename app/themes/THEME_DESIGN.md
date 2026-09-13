# Kiosco Gustavo — Theme Design System

Single-tenant kiosk catalog. One brand theme, no multi-tenant selector.
This document is the source of truth for tokens, the brand resolution,
and the rules every component must follow.

## Three-layer model

The token system has three layers. Each layer has a single responsibility.
Components consume only layer 2.

```
Layer 1 — Primitives   :  --palette-* ramps in OKLch
Layer 2 — Semantic aliases :  --color-* tokens that components consume
Layer 3 — Consumers   :  CSS Modules, inline styles, theme-aware components
```

**Layer 1 — Primitives.** Pure OKLch ramps (`--palette-50` … `--palette-900`,
plus `--palette-neutral-*`, `--palette-success-*`, `--palette-warning-*`,
`--palette-error-*`, `--palette-info-*`). Primitives are not consumed by
components. They exist so the semantic layer has a stable color space to
draw from. Changing a primitive value ripples through every semantic token
that references it.

**Layer 2 — Semantic aliases.** Role-named tokens (`--color-interactive`,
`--color-text-primary`, `--color-error`, etc.). Each alias resolves to one
primitive or a small mix. This is the only layer components are allowed to
read.

**Layer 3 — Consumers.** CSS Modules and TSX that consume layer 2. They
never reach back to layer 1. They never hardcode hex, rgb, or oklch.

Why three layers and not two: a component cannot decide between
`--palette-500` (mid hue) and `--palette-600` (deeper hue) without leaking
palette semantics into the component. Aliases give every consumer a stable
role (`button`, `error`, `text-muted`) that survives a palette swap.

---

## File layout

```
app/themes/
├── theme.css         ← layer 1: palette ramps in OKLch (single theme)
├── tokens.css        ← layer 2: semantic aliases + primitives + base styles
└── THEME_DESIGN.md   ← this document
```

`app/globals.css` contains only DOM base styles. It does not redeclare tokens.

---

## Brand identity

**Hue anchor: 25° (rojo kiosco).** The brand color matches the Gustavo
Colecciones logo (red, white, black). Neutrals are tinted with hue 50°
(cream) to bake warmth into every surface without sacrificing contrast.

```
Background      oklch(98% 0.012 50)   ← cream cálido (neutral-50)
Surface (cards) oklch(100% 0 0)       ← blanco puro (neutral-100)
Brand           oklch(50% 0.21 25)    ← palette-600, rojo vibrante
Interactive     oklch(50% 0.21 25)    ← palette-600 (same as brand)
```

The CTA `Lo quiero!` (WhatsApp link) intentionally uses `--color-success`
(green) instead of brand. WhatsApp is culturally green and clients
expect that signal. Mixing the brand red with the CTA would dilute both.

---

## Token vocabulary

Tokens are grouped by role. Every role has a primary token, and most have
`-hover`, `-light`, or `-inverse` companions.

### Surface

```
--color-background       page-level background (cream)
--color-surface          card, panel, modal background (white)
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
--color-text-inverse      text on saturated backgrounds
```

### Action and brand

```
--color-interactive          primary button background, link, CTA
--color-interactive-hover    primary button hover
--color-brand                logo, brand identity, secondary surfaces
--color-brand-hover          brand on hover
```

`--color-interactive` and `--color-brand` collapse to the same hue (the
brand is the chromatic anchor of the theme).

### State

```
--color-success    --color-success-light    --color-success-hover
--color-warning    --color-warning-light    --color-warning-hover
--color-error      --color-error-light      --color-error-hover
--color-info       --color-info-tint        --color-info-hover
```

State ramps are kept independent from brand (info is sky blue, success
is green, error is red). Collapsing them into brand would break cross-
surface parity for badges and messages.

### Focus

```
--color-focus-ring         translucent ring around focusable controls
--color-error-focus-ring   error-state ring around invalid controls
```

Both bake alpha into the OKLch call. Consumers compose them via `outline`
or `box-shadow`, never by mixing at the call site.

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

### Primitives (in `tokens.css`)

```
--font-family, --font-family-display
--font-size-xs … --font-size-display
--font-weight-*
--line-height-*
--space-0 … --space-12
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
--transition-fast, --transition-base, --transition-slow
```

Primitives do not vary by theme. Shadows are tinted with the brand hue
(`oklch(50% 0.21 25 / α)`) so every elevation step carries warmth.

---

## Hover direction

Light theme: `--color-interactive-hover` resolves one step **deeper** in
the chromatic ramp (`--palette-700`). The button visibly deepens on
hover. This is the OKLch-derived rule: hover moves the surface away
from its background.

---

## WCAG matrix

Verified contrast ratios for the text tokens against `--color-surface`
(white). WCAG AA requires ≥4.5:1 for normal text and ≥3:1 for large text.

| Pair                                 | Ratio   | Status |
| ------------------------------------ | ------- | ------ |
| `--color-text-primary` / surface     | 18.4:1  | ✓ AAA  |
| `--color-text-secondary` / surface   | 7.6:1   | ✓ AAA  |
| `--color-text-muted` / surface       | 4.7:1   | ✓ AA   |
| `--color-interactive` / surface      | 5.4:1   | ✓ AA   |
| `--color-text-inverse` / interactive | 5.4:1   | ✓ AA   |
| `--color-error` / surface            | 5.0:1   | ✓ AA   |
| `--color-success` / surface          | 3.9:1   | borderline (large text only) |

Notes:

- Success on surface is borderline for normal text because green
  (hue 155) skews darker in OKLch. Mitigation: success is only used as
  the WhatsApp CTA background with white text (`--color-text-inverse`).
  Contrast against white text on `--color-success-500` is 4.4:1 — AA for
  large text and bold. We accept this because the CTA label `Lo quiero!`
  is rendered at `--font-weight-semibold` and is a primary action
  signal, not body copy.
- Error on surface (5.0:1) clears AA. Used for the `Última unidad`
  badge, which combines with white text — also clears AA at large
  weight.

---

## Status badges

Badges follow the canonical pattern (light background + state text):

```css
background-color: var(--color-{state}-light);
color: var(--color-{state});
```

Inverse pattern (saturated background + `--color-text-inverse`) is
permitted **only** for action CTAs where the background itself is the
signal (e.g. WhatsApp success button, hero accent).

---

## Rules for new code

1. **Consume semantic aliases only.** Never write `var(--palette-*)` in a
   component CSS Module. If a role is missing, add it to `theme.css` and
   the alias to `tokens.css` first, then consume it.
2. **No color literals in components.** Zero hex (`#fff`), zero rgb
   (`rgb(...)`), zero oklch (`oklch(...)`) inside `components/`, `app/`,
   or `lib/`. Theme files own OKLch; component code reads tokens.
3. **Pick the role-aligned token.** Text uses `--color-text-*`. Actions
   use `--color-interactive` or `--color-brand`. States use
   `--color-{success|warning|error|info}`.
4. **Hover direction is theme-aware.** Use the `-hover` companion token.
   Don't write a literal `filter: brightness(...)`.
5. **Disabled state uses `--opacity-disabled`.** Do not redefine
   `opacity: 0.5` per component.

---

## Why no multi-theme

`kioscoGustavo` is a single-tenant catalog (Gustavo's kiosk, one brand).
The earlier codebase carried a six-theme system inherited from a sibling
multi-tenant project. The runtime cost (six `@import`ed CSS files,
`data-theme` selector, per-theme WCAG matrix) was dead weight for a
product with one identity. The system was collapsed to a single theme in
this pass.
