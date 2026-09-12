# AGENTS.md — kioscoGustavo

Entry point for agent sessions. Detailed architecture, decisions, and original plan live in [docs/PLANIFICACION.md](docs/PLANIFICACION.md). **Keep this file under ~150 lines**; extract detail to `docs/` if it grows.

## Priority

1. User instructions override this file.
2. This file overrides repo conventions.
3. Ambiguous → inspect existing patterns first (and check `../carta-qr/` for the reference implementation).
4. Do not invent architecture/abstractions unless the task requires it.
5. **Pattern consistency.** Pick one way to do something and apply it across the app. When introducing a new component or pattern, audit `../carta-qr/` and align; no one-offs. Same rule in JSX, CSS, commit style, or API design.

## Project

Single-tenant web app for the gustavo's kiosk (figures and collectibles, plus whatever comes next). Public catalog + WhatsApp deep-link to `Hello Gustavo!` admin panel for categories, products, and stock.

- **Owner:** Gustavo (kiosk owner). **Dev/admin:** Lucas.
- **Production:** `https://kiosco-gustavo-three.vercel.app/` (Vercel + Neon PostgreSQL).
- **Single-tenant:** no `venueId`, no roles, no subdomains, no Soketi/realtime. All updates via cache + `updateTag`.
- **Reference implementation:** `../carta-qr/` (multi-tenant sibling). Many UI primitives and patterns are adapted from there.

## Stack

- **Framework:** Next.js 16.3+ App Router (`cacheComponents: true`)
- **Language:** TypeScript strict, `noEmit`
- **Database:** PostgreSQL via Prisma 7 with `@prisma/adapter-pg` (driver adapter, no `url` in `datasource`; URL goes in `prisma.config.ts`)
- **Auth:** NextAuth 5 beta (Google provider, JWT session, whitelist via `ADMIN_EMAILS`)
- **Validation:** Zod v3
- **Forms:** react-hook-form + `@hookform/resolvers/zod`
- **Styling:** CSS Modules exclusively (no Tailwind, no styled-components)
- **Media:** UploadThing v7 (server-side `utapi.uploadFiles`, only `UPLOADTHING_TOKEN` env var)
- **Linter/Formatter:** Biome
- **Package Manager:** pnpm
- **Hosting:** Vercel

## Commands

```bash
pnpm install              # install deps
pnpm dev                  # dev server (uses .env via dotenv-cli in scripts)
pnpm build                # production build (runs prisma migrate deploy first)
pnpm start                # production server
pnpm typecheck            # tsc --noEmit
pnpm lint                 # biome lint
pnpm format               # biome format --write
pnpm db:migrate           # prisma migrate dev against .env
pnpm db:deploy            # prisma migrate deploy against .env
pnpm db:studio            # prisma studio
pnpm cron:trigger         # local cron smoke test (replace BEARER with CRON_SECRET)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup-stock
```

## Architecture

```
app/                      → routes (cacheComponents opt-out via 'use cache' + instant=false)
  page.tsx                → public catalog (loadCatalog() helper + Page with searchParams)
  login/, admin/          → auth + admin shell (inherits instant=false)
  api/cron/cleanup-stock/ → cron endpoint (Bearer CRON_SECRET)
components/
  Features/Client/        → public home (Header, CategoryTabs, ProductCard, HomePage)
  Layouts/                → Header (public) + form/ + Modals/ from carta-qr
  UI/                     → Button, ModalActions, Loading, Switch, ImageForm, Icons
  Providers/              → ToastProvider, AuthRejectionToast
lib/
  server/auth/            → auth.config.ts (edge-safe) + auth.ts (Node + PrismaAdapter)
  server/db/db.ts         → Prisma 7 singleton with PrismaPg adapter
  server/db/repository/   → category, product Prisma access
  server/useCases/        → business logic + cache invalidation
  server/actions/         → createProtectedAction wrappers (no venueId, no alloweRoles)
  server/uploadthing/     → utapi proxy + cleanup + compensateOrphanedUpload
  shared/schemas/         → Zod (category, product)
  shared/types/           → Prisma-derived types (CategoryWithCount, ProductWithRelations)
  shared/utils/           → whatsapp.ts (buildWhatsAppLink), uploadImage.ts
  shared/constants/upload.ts → MAX_UPLOAD_SIZE
proxy.ts                  → Edge middleware (NextAuth auth gate via auth.config.ts)
prisma/                   → schema.prisma + migrations
prisma.config.ts          → datasource url for migrate CLI
vercel.json               → cron schedule
next.config.ts            → cacheComponents + agentRules + images.remotePatterns (UT)
```

## Patterns

### Entity files (5-file domain convention)
- `lib/shared/schemas/<entity>.schemas.ts` — Zod (payload, form, create, update, delete).
- `lib/shared/types/<entity>.types.ts` — Prisma-derived types via `Prisma.<Entity>GetPayload<{ include: typeof INCLUDE }>`.
- `lib/server/db/repository/<entity>.repository.ts` — pure Prisma access, factory `repository(db)`.
- `lib/server/useCases/<entity>.usecases.ts` — business rules + cache invalidation.
- `lib/server/actions/<entity>.action.ts` — `createProtectedAction` wrappers + `updateTag('kiosco:<entity>')`.

### `createProtectedAction` (single-tenant)
Wraps `createAction` + `auth()`. ActionContext = `{ data, session, db }`. **No** `getVenueId`, no `allowedRoles`, no `verifyVenueAccess`. Whitelist lives in `proxy.ts` via `authCallbacks.authorized` — never duplicated in actions.

### Cache (Cache Components / Next 16)
- `'use cache'` + `cacheTag('kiosco:<entity>')` for reads.
- `updateTag('kiosco:<entity>')` after every mutation.
- Cache prefix ALWAYS `kiosco:*` — never `venue:*`, never loose, never per-id.
- `'use cache'` cannot co-exist with `await searchParams`/`cookies()`/`headers()` in the same scope. Split into `loadCatalog()` (cached) + `Page()` (resolves searchParams outside cache scope).
- Routes under `/admin/*` opt out of static prerender with `export const instant = false` on the layout. Route handlers (`app/api/**/route.ts`) opt out the same way — `export const dynamic`/`runtime` is rejected by Cache Components.
- `createProtectedAction` calls `auth()` server-side. `proxy.ts` (Edge) imports only `auth.config.ts` to keep Prisma out of the Edge bundle.

### Server actions
- Always `'use server'`. Return `ActionResult<T>` = `{ success: true, data } | { success: false, data: null, error: { message, cause? } }`.
- Zod errors formatted as `path 🡆 message` strings (see `lib/server/actions/createAction.ts`).
- Client errors via `react-hot-toast` (`showToast.error(result.error.message)`).
- Auth/session error actions (`signIn`/`signOut`) bypass `createAction` (NextAuth requirement) and live under `lib/server/actions/auth/`.

### UI primitives (adapted from carta-qr)
- `components/Layouts/form/{Form,InputForm,SelectForm,SectionForm,TextareaForm}.tsx` — react-hook-form + zodResolver.
- `components/Layouts/Modals/Modal.tsx` — props-based `open`/`onClose`, no context.
- `components/UI/{Button,Loading,ModalActions,Switch,ImageForm,Icons}/*` — reusable, copy-paste-ready from carta-qr.

### UploadThing lazy upload (server-side)
- `<ImageForm>` stores `{ file: File }` in form state; **no upload until form submit**.
- Server action calls `resolveImageUpload()` which invokes `uploadImageAction()` → `utapi.uploadFiles()` with `customId: kiosco/products/<uuid8>`.
- `compensateOrphanedUpload({ uploadedFileKey, save })` rolls back the upload if the DB write fails.
- `cleanupUploadThingFileIfNeeded(oldKey, newKey)` deletes the previous file on update.
- Hard delete of a product always calls `deleteUploadThingFile(fileKey)` first.

### Business rules in `useCases` (single source of truth)
- **Category:** max 2 levels hierarchy; no self-parent; cannot convert a category into a sub if it already has children; cannot delete with products or subcategories.
- **Product:** stock=0 sets `stockZeroAt = new Date()`; stock>0 clears it; price/stock are `Int` ARS; `decrementStock` rejects going negative.
- **Client visibility:** only `isActive=true AND stock>0` products appear in the public catalog.

## Code Style

- **Code:** English. **User-facing:** Rioplatense Spanish.
- **Files:** kebab-case CSS modules, PascalCase components, camelCase utilities/actions.
- **Imports:** `@/*` alias; group external → internal (`@/`) → relative. Top-level `import type` only.
- **Biome** (`biome.json`) — semicolons required, single quotes, trailing commas, `lineWidth: 100`, 2-space indent. CSS files excluded.
- **No comments** unless explicitly requested. Self-documenting code.
- **Unused bindings** use `_` prefix (Biome `noUnusedVariables` honors `^_`). Never `// biome-ignore`.

## Security

- `ADMIN_EMAILS` (CSV) is the single source of truth for the whitelist. Parsed by `lib/env.ts` into `string[]`. Lowercased.
- Auth redirects via the function form, never string concat. `proxy.ts` enforces the whitelist for `/admin/*`.
- UploadThing routes live behind `auth()`. Cron endpoint validates `Authorization: Bearer ${CRON_SECRET}` (500 if `CRON_SECRET` not set, 401 if missing/wrong, 200 with `{ deletedCount, ids, durationMs }` on success).
- Never log secrets, tokens, or credentials.
- Public env vars (`NEXT_PUBLIC_*`) are the only ones exposed to the client bundle.

## Git

Conventional commits with scopes. Common scopes: `auth`, `actions`, `admin`, `client`, `cron`, `crud`, `db`, `setup`, `config`, `docs`.

Examples:

```
feat(actions): add product server actions and UploadThing lazy upload
fix(cron): handle empty candidates list
chore(deps): bump next to 16.3.4
docs: mark Phase 6 complete (deploy with end-to-end smoke test)
```

Subject line max 100 chars, imperative or infinitive mood. Body in present tense or imperative; bullets for multi-area changes. One concern per commit (entity files → actions → UI → docs).

## Environment variables

`.env.example` documents all of them with placeholders. Current production values are in Vercel project settings. Notable:

- `NEXT_PUBLIC_APP_NAME` — kiosk display name (currently "Kiosco Lucas", temporary).
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — E.164 without `+`, e.g. `542234360228`.
- `ADMIN_EMAILS` — CSV of allowed admin emails (lowercased by Zod).
- `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — required for NextAuth.
- `DATABASE_URL` — Neon connection string.
- `UPLOADTHING_TOKEN` — only required for image uploads.
- `CRON_SECRET` — required for the Vercel cron (Bearer token).

## References

- [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md) — original plan, stack details, decisions log (sections §2 stack, §3 auth, §4 domain, §7 carta-qr patterns, §8 features, §9 phases).
- `../carta-qr/AGENTS.md` — structural reference (sibling project, multi-tenant).
- `../carta-qr/lib/`, `../carta-qr/components/` — reusable primitives and the source of truth for "how things look here".
- Engram memory — patterns learned during implementation (search `kiosk-*` topic keys for the most relevant ones).
