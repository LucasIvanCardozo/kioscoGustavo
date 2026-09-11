# AGENTS.md — Kiosco de Gustavo

Puerta de entrada para futuras sesiones. **Single source of truth para arquitectura, modelo de datos, fases y decisiones:** [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md). Este archivo es solo la versión resumida y el índice rápido.

---

## Estado actual

| Fase | Estado | Notas |
|---|---|---|
| **0. Setup base** | ⏳ Pendiente | No se ha iniciado. Directorio contiene solo `.git`, `.atl`, `.gitignore`, `docs/`. |
| 1. Auth admin | 🔒 Bloqueado | Depende de Fase 0 + `ADMIN_EMAILS` configurado |
| 2. Categorías CRUD | 🔒 Bloqueado | |
| 3. Productos CRUD + imagen + stock | 🔒 Bloqueado | |
| 4. Vista cliente | 🔒 Bloqueado | Depende de `NEXT_PUBLIC_WHOTSAPP_NUMBER` |
| 5. Cron job | 🔒 Bloqueado | Solo en deploy |
| 6. Deploy | 🔒 Bloqueado | |

**Leyenda:** ⏳ Pendiente · 🚧 En curso · ✅ Completa · 🔒 Bloqueada por dependencia

**Actualizar esta tabla en cada sesión** según se avanza. Detalle completo de cada fase en [PLANIFICACION.md §9](docs/PLANIFICACION.md#9-fases-de-implementacion).

---

## Priority

1. Instrucciones explícitas del usuario > este archivo > convenciones del repo.
2. Si hay ambigüedad, releer [PLANIFICACION.md](docs/PLANIFICACION.md) antes de inventar.
3. **No inventar arquitectura/abstracciones** que no estén justificadas por el plan.
4. **Consistencia de patrón.** Si se introduce algo nuevo, auditar uso existente en `carta-qr/` y alinearse; no hacer one-offs.
5. **Decisión nueva → primero PLANIFICACION.md, código después.** Si una decisión cambia el plan, actualizar el doc antes de commitear.

---

## Project

App web **single-tenant** para el kiosco de Gustavo. Vista pública (catálogo + WhatsApp deep link) y panel admin (categorías + productos + stock). Diferencias explícitas con `carta-qr`:

| | carta-qr | kioscoGustavo |
|---|---|---|
| Tenant | Multi-tenant, subdominios | **Single-tenant** |
| Cache prefix | `venue:{venueId}:*` | **`kiosco:*`** |
| Realtime | Soketi/Pusher | **No** (cache + `updateTag` + `revalidatePath`) |
| Roles | admin, cajero, mozo, client | **Solo admin** (whitelist por email) |
| Stock | No existe | **Sí**, columna simple con auto-cleanup vía cron |
| Auth | NextAuth + roles | **NextAuth + whitelist hardcodeada** |
| Borrado | Soft delete (`isActive`) | **Hard delete** vía cron cada 30 días |

---

## Stack (resumen)

Next.js 16.2+ App Router · TypeScript strict · Prisma 7 + PostgreSQL (Neon) · NextAuth 5 beta (Google) · Zod v3 · react-hook-form · react-hot-toast · UploadThing · Biome · CSS Modules · pnpm · Vercel.

Versiones y detalle completo: [PLANIFICACION.md §2](docs/PLANIFICACION.md#2-stack-confirmado).

---

## Decisiones críticas a NO romper

Estas decisiones son contrato. Si una sesión las quiere cambiar, **primero actualizar PLANIFICACION.md**, después implementar.

1. **NO realtime.** No agregar Soketi, Pusher, ni websockets. Toda actualización es vía cache + `updateTag`.
2. **Cache prefix siempre `kiosco:`.** Nunca `venue:`, nunca suelto, nunca por id.
3. **`createProtectedAction` SIN venueId.** Versión adaptada (sin `getVenueId`, sin `verifyVenueAccess`, sin `allowedRoles`). Solo chequea session válida.
4. **Whitelist en `authorized` callback de NextAuth**, NO en actions. Configurada vía `ADMIN_EMAILS` (CSV).
5. **Stock = 0 → oculto al cliente inmediatamente.** Hard delete solo vía cron después de 30 días. NO soft delete con `isActive` (eso es carta-qr).
6. **Lazy upload de imágenes** vía `utapi.uploadFiles` server-side. NO upload temprano con `<UploadButton>`.
7. **Mensaje WhatsApp es solo nombre del producto.** No cambiar formato sin consultar.

---

## Patrones heredados de carta-qr

Lista detallada de qué se copia 1:1 vs qué se adapta: [PLANIFICACION.md §7](docs/PLANIFICACION.md#7-patrones-a-reusar-de-carta-qr-11-copiar-y-pegar).

**Resumen ejecutivo:**
- **Copiar literal:** `biome.json`, `createAction.ts`, layouts/form, layouts/Modals, UI/Button, UI/Icons, `lib/shared/types/image.ts`, `lib/server/uploadthing/cleanup.ts`, theme tokens.
- **Adaptar:** `createProtectedAction` (sin venue), `resolveImageUpload` (sin venueId), `category.repository` (sin venueId, mantener validación 2 niveles), todos los modales (sin notion de venue).
- **NO copiar:** `proxy.ts`, `app/[slug]/*`, todo lo de órdenes/pagos/combos/soketi, `verifyVenueAccess`, schema Prisma completo.

Referencia externa: `../carta-qr/` (hermano en el filesystem). Sus docs viven en `../carta-qr/docs/`.

---

## Commands

Aún no instalado. Cuando arranquemos Fase 0, los comandos serán:

```bash
pnpm install              # instalar deps
pnpm dev                  # dev server
pnpm build                # build prod
pnpm typecheck            # tsc --noEmit
pnpm lint                 # biome
pnpm format               # biome format --write
pnpm test                 # vitest (cuando esté)
pnpm test:e2e             # playwright (cuando esté)
pnpm db:migrate           # prisma migrate dev
pnpm db:studio            # prisma studio
```

---

## Convenciones

- **Código en inglés.** UI y mensajes de error en **español rioplatense**.
- **Sin comments** salvo que el usuario lo pida explícitamente. Self-documenting code.
- **Imports:** `@/*` alias; external → `@/` → relative. `import type` solo top-level.
- **Biome:** semicolons, single quotes, trailing commas, `lineWidth: 100`, 2-space indent. CSS excluido.
- **No unused bindings** (prefijo `_`).
- **Errores en actions:** `ActionResult<T>` con `{ success, data, error }`. Zod format `path 🡆 message`.
- **Commits:** conventional con scope. Ej: `feat(admin): add product CRUD`, `fix(cron): handle empty candidates`. Subject ≤100 chars, imperativo.

---

## Protocolo de sesión

**Al iniciar una sesión:**

1. **Releer [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md)** completo (especialmente la sección de la fase actual).
2. **Revisar la tabla "Estado actual"** arriba. Confirmar en qué fase estamos.
3. **Revisar memoria** (`mem_context`) por observaciones guardadas en sesiones anteriores.
4. **Si hay pendientes críticos** (ver §Pendientes abajo), preguntar al usuario antes de implementar.

**Durante la sesión:**

- Si surge una decisión que cambia el plan → actualizar PLANIFICACION.md primero.
- Si se completa una fase → actualizar la tabla "Estado actual" arriba.
- Si se copia/adapt código de carta-qr → revisar que el archivo de origen no haya cambiado recientemente.

**Al cerrar sesión:**

- Marcar el progreso en la tabla "Estado actual".
- Si hubo decisiones nuevas, confirmar que están en PLANIFICACION.md.
- Guardar observaciones no obvias en memoria (`mem_save`).

---

## Pendientes antes de implementar

Datos que faltan del usuario antes de empezar la Fase 1 (auth):

- [ ] **Número de WhatsApp real de Gustavo** (formato E.164 sin `+`, ej: `5491145678901`)
- [ ] **Emails concretos para `ADMIN_EMAILS`** (mínimo el de Gustavo)
- [ ] **Nombre comercial del kiosco** (para header público y `<title>`)
- [ ] **Logo del kiosco** (opcional, PNG/SVG cuadrado idealmente)
- [ ] **Google OAuth client** creado en Google Cloud Console con redirect URI autorizado

Detalle y otros: [PLANIFICACION.md §11](docs/PLANIFICACION.md#11-pendientes-antes-de-implementación).

---

## Referencias

- [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md) — Single source of truth (16 secciones, ~730 líneas)
- `../carta-qr/` — Proyecto hermano, fuente de patrones y código reutilizable
- `../carta-qr/docs/architecture/` — Patrones a reusar
- `../carta-qr/AGENTS.md` — Ejemplo de estructura (referencia, no copiar literal)

---

_Mantener este archivo bajo ~150 líneas. Si crece, extraer detalle a `docs/`._
