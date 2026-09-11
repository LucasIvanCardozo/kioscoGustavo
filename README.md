# Kiosco de Gustavo

Catálogo público + panel admin para el kiosco de Gustavo.

## Quick start

```bash
pnpm install
cp .env.example .env
# Completar en .env: AUTH_SECRET y CRON_SECRET (openssl rand -base64 32)
# Ajustar DATABASE_URL al Postgres local (default asume postgres/postgres en :5432).
# Crear la DB local: createdb kiosco_gustavo
pnpm db:migrate
pnpm dev
```

App disponible en [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | Qué hace                                  |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Levanta Next.js en modo desarrollo        |
| `pnpm build`        | Compila para producción                   |
| `pnpm start`        | Sirve el build de producción              |
| `pnpm typecheck`    | `tsc --noEmit`                            |
| `pnpm lint`         | Biome lint                                |
| `pnpm format`       | Biome format --write                      |
| `pnpm test`         | Vitest (configurar en Fase 2/3)           |
| `pnpm test:e2e`     | Playwright (configurar en Fase 4)         |
| `pnpm db:migrate`   | Prisma migrate dev                        |
| `pnpm db:studio`    | Prisma Studio                             |

## Fase 0 completada

- Next.js 16.x App Router + TypeScript strict.
- Prisma 7 + driver adapter `@prisma/adapter-pg` + `pg`.
- Biome (lint + format) con la config de carta-qr.
- Tema visual (tokens CSS) portado literal desde carta-qr.
- Validación de variables de entorno con Zod en `lib/env.ts`.
- Cliente Prisma singleton con patrón `globalThis` en `lib/server/db/db.ts`.
- Schema Prisma inicial con `Category` y `Product` (§4.1 del plan).
- `cacheComponents: true` activado.
- Página placeholder de Fase 0.

## Próximas fases

1. **Fase 1 — Auth admin.** NextAuth 5 (Google) + whitelist `ADMIN_EMAILS` en `authorized` callback. Página `/login` y `/admin` placeholder.
2. **Fase 2 — Categorías CRUD.** Jerarquía de 2 niveles, sin `venueId`.
3. **Fase 3 — Productos CRUD + imagen + stock.** UploadThing, lazy upload, `isActive` separado de stock.
4. **Fase 4 — Vista cliente.** Home con grid, filtro por categoría, `ProductCard` con botón WhatsApp.
5. **Fase 5 — Cron job.** `vercel.json` + endpoint `/api/cron/cleanup-stock`.
6. **Fase 6 — Deploy.** Neon + Vercel + dominio.

## Documentación

- [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md) — Plan completo del proyecto (16 secciones).
- [`AGENTS.md`](AGENTS.md) — Guía de contexto y convenciones.