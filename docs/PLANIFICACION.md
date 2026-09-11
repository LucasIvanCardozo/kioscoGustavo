# Kiosco de Gustavo — Planificación

> Documento vivo de planificación. Toda decisión de producto, modelo de datos, arquitectura y fases queda registrada acá para futuras sesiones. Antes de implementar, releer este archivo completo.

---

## 1. Resumen ejecutivo

App web para el kiosco de Gustavo (diarios/revistas histórico, hoy centrado en **figuras y partes de colección**). Dos audiencias con un único objetivo: **publicar y consultar el stock disponible del momento**.

- **Cliente** (visitante del kiosco, sin login): abre la app en el celular, ve categorías y productos con foto, precio y stock. Si le interesa algo, toca un botón y se abre WhatsApp con un mensaje pre-armado hacia Gustavo.
- **Admin** (únicamente Gustavo, más eventuales whitelists): inicia sesión con Google, gestiona categorías y productos (CRUD), ajusta stock manualmente, sube fotos.

**Principios rectores:** simple, efectiva, mobile-first en el cliente, rápida para Gustavo en el backoffice.

---

## 2. Stack confirmado

| Capa             | Tecnología                                                                        |
| ---------------- | --------------------------------------------------------------------------------- |
| Framework        | Next.js 16.2+ (App Router, `cacheComponents` habilitado como en carta-qr)         |
| Lenguaje         | TypeScript strict, `noEmit`                                                       |
| DB               | PostgreSQL vía Prisma 7 + `@prisma/adapter-pg`                                    |
| DB hosting       | **Vercel + Neon**                                                                 |
| Auth             | NextAuth 5 (beta) — provider único: **Google**                                    |
| Validación       | Zod v3                                                                            |
| Forms            | react-hook-form + `@hookform/resolvers/zod`                                       |
| Toasts           | react-hot-toast (vía Context Provider como carta-qr)                              |
| Imágenes         | UploadThing (lazy upload server-side con `utapi.uploadFiles`)                     |
| Linter/Formatter | Biome                                                                             |
| Estilos          | CSS Modules (sin Tailwind, sin styled-components)                                 |
| Realtime         | **No se usa.** Sin Soketi/Pusher. Cache + `updateTag` + `revalidatePath` alcanza. |
| Package manager  | pnpm                                                                              |
| Hosting app      | Vercel                                                                            |
| Dominio          | A definir. Mientras tanto: `kiosco-gustavo.vercel.app`                            |

---

## 3. Roles y autenticación

### 3.1 Modelo de acceso

- **Sin login de cliente.** El home es 100% público.
- **Login solo en `/admin/*`.** Cualquier intento de acceder a `/admin/*` sin sesión redirige a `/login`.
- **Provider único:** Google (igual que carta-qr).
- **Whitelist hardcodeada por email.** Configurada en variable de entorno `ADMIN_EMAILS` como CSV. Gustavo es el primer email. Pueden sumarse otros si hace falta, sin redeploy obligatorio (rotación de env var).
- **Si un usuario autenticado con Google NO está en la whitelist** y entra a `/admin/*`, queda expulsado al home `/` con un toast informativo.

### 3.2 Implementación del guard

Modifica el callback `authorized` de NextAuth para que mire la whitelist cuando la ruta sea admin:

```ts
// lib/server/auth/authCallbacks.ts (adaptación)
authorized: async ({ auth, request }) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!auth?.user?.email) return false; // → redirect a /login
    const allowed = env.ADMIN_EMAILS.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return allowed.includes(auth.user.email.toLowerCase());
  }

  return true;
};
```

`createProtectedAction` mantiene el patrón de carta-qr, pero la whitelist se chequea a nivel de middleware/callback de NextAuth, no dentro del wrapper (porque ya no hay roles ni `venueId`). El wrapper queda como **dead-code seguro**: si la ruta pasa el guard, el handler corre; si no, ni siquiera se invoca la action.

> Nota: el `createProtectedAction` de carta-qr requiere `getVenueId` opcional y `allowedRoles`. En kioscoGustavo no hay venue. La copia se simplifica: el wrapper exige `session` válida (no nula) y pasa `{ data, session, db }` al handler. El chequeo de whitelist vive en el `authorized` callback.

### 3.3 Variables de entorno relacionadas con auth

```
AUTH_SECRET=
AUTH_URL=                                # Vercel lo completa solo, pero documentar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS=gustavo@gmail.com,respaldo@gmail.com
```

---

## 4. Modelo de dominio

### 4.1 Prisma schema (target)

```prisma
// prisma/schema.prisma — extracto

model Category {
  id          String     @id @default(cuid())
  name        String
  description String?
  order       Int        @default(0)
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([parentId, order])
}

model Product {
  id            String   @id @default(cuid())
  name          String
  description   String?
  price         Int       // en pesos ARS enteros (sin centavos). Consistencia con carta-qr.
  stock         Int       @default(0)
  image         String?   // URL pública de UploadThing
  imageFileKey  String?   // opaque fileKey para cleanup
  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  isActive      Boolean   @default(true)
  stockZeroAt   DateTime? // timestamp en que stock llegó a 0. Lo usa el cron.
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([categoryId])
  @@index([isActive, stock])
  @@index([stockZeroAt])
}
```

**Decisiones del modelo:**

- `price` es `Int` en pesos ARS enteros (carta-qr ya lo hace así; evita problemas de redondeo).
- `stock: Int` arranca en 0. Decisión confirmada: **columna simple en Product**.
- `stockZeroAt` se setea la primera vez que `stock` pasa a 0. Lo usa el cron para borrar productos que llevan **más de 30 días en 0**. Si Gustavo edita el stock y vuelve a 0 otra vez, se resetea el timestamp (no se resetea si pasa de 0 a >0; se resetea solo si pasa de >0 a 0).
- `isActive` existe **además** de `stock`, para que Gustavo pueda pausar manualmente un producto sin tener que setear stock=0 (ej: "se va de vacaciones, no quiero que aparezca").
- `categoryId` con `onDelete: Restrict` (no se puede borrar una categoría con productos asociados). El cliente ve error claro si intenta.
- `image` + `imageFileKey` siguen el patrón lazy upload de carta-qr (`ImageForm`, `resolveImageUpload`, `cleanupUploadThingFileIfNeeded`, `deleteUploadThingFile`).

### 4.2 Reglas de negocio

- **Stock = 0 → oculto al cliente inmediatamente** (no se muestra en la home ni en listados). Pero el producto **no se borra**: Gustavo tiene 30 días para reactivarlo.
- **Cron de limpieza**: corre diario a las 03:00 ART. Borra productos con `stock = 0 AND stockZeroAt < (now - 30 days)`. Borra la fila + la imagen en UploadThing.
- **Categoría con subcategorías (2 niveles máx)**: validación idéntica a carta-qr (`MAX_CATEGORY_LEVELS = 2`, validación en repository). No se permite borrar categoría con productos; no se permite convertir en subcategoría si ya tiene subcategorías.
- **Producto sin categoría**: el form requiere categoría (`productCategoryId` obligatorio). No hay "categoría general" o null.

### 4.3 Visibilidad de productos

| Estado                                      | Admin lo ve           | Cliente lo ve | Botón WhatsApp |
| ------------------------------------------- | --------------------- | ------------- | -------------- |
| `isActive = true`, `stock > 0`              | ✅                    | ✅            | ✅             |
| `isActive = true`, `stock = 0`, `< 30 días` | ✅                    | ❌ (oculto)   | ❌             |
| `isActive = true`, `stock = 0`, `> 30 días` | ❌ (borrado por cron) | ❌            | ❌             |
| `isActive = false` (pausado por Gustavo)    | ✅ (badge "Pausado")  | ❌            | ❌             |

En el form de edición, el admin tiene dos switches separados:

1. **Stock** (number input, +1 / -1 / directo).
2. **Pausado** (`isActive`, switch). Default: activo.

---

## 5. Cache tag convention (adaptada a single-tenant)

Carta-qr usa `venue:{venueId}:{entity}`. Kiosco es single-tenant, así que el prefijo pasa a ser simplemente `kiosco:{entity}`:

```typescript
cacheTag("kiosco:categories");
cacheTag("kiosco:products");
```

Reglas (heredadas de carta-qr, adaptadas):

1. Prefijo `kiosco:` siempre. Nunca nombre suelto.
2. Sufijo en plural: `categories`, `products`.
3. El `imageFileKey` **NO** forma parte de ninguna cache key. Solo se usa para cleanup.
4. Server actions llaman `updateTag('kiosco:{entity}')` después de mutar (read-your-own-writes).
5. Sin cache tags por id, por rango, ni por query param.
6. **Sin realtime**: el cliente recibe datos frescos al `router.refresh()` o navegación. No hay Soketi.

---

## 6. Estructura de carpetas

Basada en carta-qr, simplificada para single-tenant (sin `[slug]`, sin subdominios, sin `venueId`):

```
kioscoGustavo/
├── app/
│   ├── layout.tsx                       # Root layout + Providers (UI, Toast)
│   ├── page.tsx                         # Home CLIENTE (público)
│   ├── page.module.css
│   ├── globals.css
│   ├── themes/
│   │   ├── THEME_DESIGN.md              # Copiado de carta-qr (reglas de tokens)
│   │   └── tokens.css                   # Copiado de carta-qr
│   ├── login/
│   │   └── page.tsx                     # Pantalla con botón "Continuar con Google"
│   ├── admin/
│   │   ├── layout.tsx                   # Auth gate (server component, llama auth())
│   │   ├── page.tsx                     # Dashboard admin (resumen: stock bajo, productos)
│   │   ├── categorias/
│   │   │   └── page.tsx                 # Tabla + CRUD
│   │   ├── productos/
│   │   │   └── page.tsx                 # Tabla + CRUD + filtros
│   │   └── _components/                 # Componentes privados del admin
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/route.ts
│       └── cron/
│           └── cleanup-stock/route.ts   # Endpoint del cron (protegido con CRON_SECRET)
├── components/
│   ├── Features/
│   │   ├── Admin/
│   │   │   ├── Categorias/              # Tabla, filtros, modales (Add/Edit/Delete)
│   │   │   └── Productos/               # Tabla, filtros, modales, ImageForm
│   │   └── Client/
│   │       ├── HomePage/                # Vista pública
│   │       ├── CategoryTabs/            # Tabs/chips de categorías
│   │       └── ProductCard/             # Card individual con botón WhatsApp
│   ├── Layouts/
│   │   ├── form/                        # Copiado de carta-qr: Form, SectionForm, InputForm, SelectForm, ImageForm
│   │   ├── Modals/                      # Copiado de carta-qr: Modal, ButtonModal
│   │   ├── Header/                      # Header público (logo kiosco + nombre)
│   │   └── AdminShell/                  # Sidebar/Topbar admin
│   ├── UI/
│   │   ├── Button/                      # Copiado de carta-qr
│   │   ├── Icons/                       # Copiado de carta-qr (FontAwesome wrappers)
│   │   └── ...
│   └── Providers/                       # Context providers (UI, Toast)
├── lib/
│   ├── env.ts                           # Zod validación de env vars
│   ├── shared/
│   │   ├── schemas/
│   │   │   ├── category.schemas.ts      # Patrón carta-qr
│   │   │   ├── product.schemas.ts       # Patrón carta-qr (con formSchema/payloadSchema para imagen)
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── category.types.ts
│   │   │   ├── product.types.ts
│   │   │   ├── image.ts                 # Copiado de carta-qr
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   └── upload.ts                # MAX_UPLOAD_SIZE
│   │   └── utils/
│   │       ├── uploadImage.ts           # resolveImageUpload (sin venueId)
│   │       ├── whatsapp.ts              # buildWhatsAppLink(number, message)
│   │       └── ...
│   └── server/
│       ├── auth/
│       │   ├── auth.ts                  # NextAuth config (Google provider, JWT session)
│       │   ├── authCallbacks.ts         # authorized() con whitelist
│       │   └── routeGuards.ts           # requireAdmin() helper para RSC
│       ├── db/
│       │   ├── db.ts                    # Prisma client singleton
│       │   ├── prisma/                  # schema.prisma + migraciones
│       │   └── repository/
│       │       ├── category.repository.ts
│       │       ├── product.repository.ts
│       │       └── index.ts
│       ├── useCases/
│       │   ├── category.usecases.ts
│       │   ├── product.usecases.ts
│       │   └── index.ts
│       ├── actions/
│       │   ├── auth/
│       │   │   ├── signIn.action.ts     # unwrapped (excepción documentada carta-qr)
│       │   │   └── signOut.action.ts    # unwrapped (excepción documentada carta-qr)
│       │   ├── category.action.ts
│       │   ├── product.action.ts
│       │   ├── uploadImage.action.ts    # Server-side upload vía utapi
│       │   ├── createAction.ts          # Copiado de carta-qr
│       │   └── ...
│       ├── uploadthing/
│       │   ├── cleanup.ts               # cleanupUploadThingFileIfNeeded, deleteUploadThingFile
│       │   └── config.ts                # utapi init
│       └── createProtectedAction.ts     # Adaptado (sin venueId, solo check session)
├── hooks/
│   └── useReload.ts                     # Copiado de carta-qr si existe
├── contexts/
│   └── Providers/                       # UIProvider, ToastProvider
├── public/
├── prisma/
│   └── schema.prisma                    # Fuente de verdad del schema
├── vercel.json                          # Configuración del cron job
├── next.config.ts
├── biome.json                           # Copiado de carta-qr
├── tsconfig.json
├── package.json
└── docs/
    └── PLANIFICACION.md                 # Este archivo
```

---

## 7. Patrones a reusar de carta-qr (1:1, copiar y pegar)

Estos archivos se copian textuales desde carta-qr y se importan al kiosco sin reescribir:

| Archivo / Carpeta de origen           | Destino en kioscoGustavo              | Notas                                                                                             |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `lib/server/actions/createAction.ts`  | `lib/server/actions/createAction.ts`  | Idéntico                                                                                          |
| `lib/server/createProtectedAction.ts` | `lib/server/createProtectedAction.ts` | **Adaptar:** quitar `getVenueId`, `allowedRoles`, `verifyVenueAccess`. Solo exige session válida. |
| `components/Layouts/form/*`           | `components/Layouts/form/*`           | Idéntico                                                                                          |
| `components/Layouts/Modals/*`         | `components/Layouts/Modals/*`         | Idéntico                                                                                          |
| `components/UI/Icons/*`               | `components/UI/Icons/*`               | Idéntico                                                                                          |
| `components/UI/Button/*`              | `components/UI/Button/*`              | Idéntico                                                                                          |
| `lib/shared/types/image.ts`           | `lib/shared/types/image.ts`           | Idéntico                                                                                          |
| `lib/shared/utils/uploadImage.ts`     | `lib/shared/utils/uploadImage.ts`     | **Adaptar:** quitar `venueId`, mantener `entityType: 'products' \| 'categories'`                  |
| `lib/shared/constants/upload.ts`      | `lib/shared/constants/upload.ts`      | Idéntico                                                                                          |
| `lib/server/uploadthing/cleanup.ts`   | `lib/server/uploadthing/cleanup.ts`   | Idéntico (cleanup es client-safe)                                                                 |
| `lib/server/uploadthing/config.ts`    | `lib/server/uploadthing/config.ts`    | Idéntico                                                                                          |
| `app/themes/THEME_DESIGN.md`          | `app/themes/THEME_DESIGN.md`          | Idéntico                                                                                          |
| `app/themes/tokens.css`               | `app/themes/tokens.css`               | Idéntico                                                                                          |
| `biome.json`                          | `biome.json`                          | Idéntico                                                                                          |
| `hooks/useReload.ts` (si existe)      | `hooks/useReload.ts`                  | Idéntico                                                                                          |
| `contexts/Providers/UIProvider.tsx`   | `contexts/Providers/UIProvider.tsx`   | Idéntico (toast + modal state)                                                                    |
| `next.config.ts` (config base)        | `next.config.ts`                      | Idéntico (cacheComponents habilitado)                                                             |

### 7.1 Archivos que NO se copian (no aplican)

- `proxy.ts` (carta-qr hace rewrite multi-tenant).
- `app/[slug]/*` (toda la jerarquía de venues).
- Todo lo relacionado con órdenes, pagos, combos, modificadores, invitados, empleados, impresoras, soketi.
- `lib/server/auth/verifyVenueAccess.ts` (no hay venues).
- `lib/server/auth/printToken.ts` (no hay POS).
- Todo `prisma/schema.prisma` se redacta desde cero.

---

## 8. Implementación detallada por feature

### 8.1 Categorías (CRUD)

**Schema** (single-tenant, 2 niveles):

```ts
// category.schemas.ts
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: optionalTrimmedString,
  order: z.coerce
    .number()
    .int()
    .nonnegative("El orden debe ser mayor o igual a 0"),
  parentCategoryId: optionalParentCategoryId,
});

export const createCategorySchema = z.object({
  data: categoryPayloadSchema,
});
```

**Repository** copia `category.repository.ts` de carta-qr, pero:

- Quita `venueId` de inputs.
- Mantiene `MAX_CATEGORY_LEVELS = 2`.
- Mantiene validación de "no se puede borrar si tiene productos".
- Mantiene "no se puede convertir en sub si ya tiene subs".

**Use cases** copia patrón:

```ts
export const categoryUseCases = {
  async getAll() {
    "use cache: remote";
    cacheLife("days");
    cacheTag("kiosco:categories");
    return categoryRepository(db).getAll();
  },
  async getAllWithProductCount() {
    /* igual */
  },
  async createCategory(db, { data }) {
    return categoryRepository(db).create({ data });
  },
  async updateCategory(db, { id, data }) {
    /* ... */
  },
  async deleteCategory(db, { id }) {
    /* ... */
  },
};
```

**Action** usa `createProtectedAction` (versión adaptada a kiosco):

```ts
"use server";
export const createCategory = createProtectedAction({
  schema: createCategorySchema,
  handler: async ({ data, db }) => {
    const cat = await categoryUseCases.createCategory(db, { data });
    updateTag("kiosco:categories");
    return cat;
  },
});
```

**UI admin**:

- Tabla con columnas: nombre, orden, parent (con breadcrumb), # productos, acciones.
- Filtros: por parent (raíz/sub).
- Botón "+ Nueva categoría" abre `AddCategoryModal` con `SectionForm` (Datos básicos + Parent).
- `EditCategoryModal` similar.
- `DeleteCategoryModal` con confirmación.

### 8.2 Productos (CRUD + imagen + stock)

**Schema** sigue patrón carta-qr (formSchema + payloadSchema para imagen):

```ts
// product.schemas.ts
const imageValueSchema = z.union([
  z.literal(""),
  z.object({ url: z.string().url(), fileKey: z.string().min(1) }),
]);
const imageValueFormSchema = z.union([
  z.literal(""),
  z.object({ url: z.string().url(), fileKey: z.string().min(1) }),
  z.object({ file: z.instanceof(File) }),
]);

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .int()
    .nonnegative("El precio debe ser mayor o igual a 0"),
  stock: z.coerce.number().int().nonnegative(),
  image: imageValueFormSchema.optional(),
  categoryId: z.string().trim().min(1, "La categoría es requerida"),
});

export const productPayloadSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  price: z.coerce.number().int().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  image: imageValueSchema.optional(),
  categoryId: z.string().trim().min(1),
});
```

**Repository** (`product.repository.ts`):

- `getAll()`, `getById(id)`, `create`, `update`, `delete`, `setActive`.
- `getActive()` filtra `isActive = true AND stock > 0` (lo que ve el cliente).
- `getActiveByCategory(categoryId)`.
- Sin `venueId` en inputs.

**Use cases**:

```ts
export const productUseCases = {
  async getAllActive() {
    "use cache: remote";
    cacheLife("hours");
    cacheTag("kiosco:products");
    return productRepository(db).getAllActive();
  },
  async getAllActiveByCategory({ categoryId }) {
    /* ... */
  },
  async createProduct(db, { data }) {
    const product = await productRepository(db).create({ data });
    return product;
  },
  async updateProduct(db, { id, data }) {
    const current = await productRepository(db).getById({ id });
    const product = await productRepository(db).update({ id, data });
    // Si stock pasó de >0 a 0 → set stockZeroAt
    if (current && current.stock > 0 && product.stock === 0) {
      await productRepository(db).setStockZeroAt({
        id,
        stockZeroAt: new Date(),
      });
    }
    // Cleanup imagen si cambió
    await cleanupUploadThingFileIfNeeded(
      current?.imageFileKey,
      data.imageFileKey,
    );
    return product;
  },
  async deleteProduct(db, { id }) {
    const product = await productRepository(db).getById({ id });
    const deleted = await productRepository(db).delete({ id });
    if (product?.imageFileKey)
      await deleteUploadThingFile(product.imageFileKey);
    return deleted;
  },
  async setProductActive(db, { id, isActive }) {
    /* ... */
  },
  async decrementStock(db, { id, quantity }) {
    // Usado por acción rápida "Marcar como vendido" si se agrega en el futuro. Por ahora, no-op.
  },
};
```

**UI admin**:

- Tabla: imagen (thumbnail), nombre, categoría (con breadcrumb), precio, stock (con badge de color), estado (Activo/Pausado/Sin stock), acciones.
- Filtros: por categoría, por estado (todos/activos/sin stock/pausados), búsqueda por nombre.
- `AddProductModal`: `SectionForm` (Datos básicos: nombre, descripción, precio, stock, categoría), `SectionForm` (Imagen: `ImageForm` con entityType='products'), botón Guardar.
- `EditProductModal`: igual, con datos pre-cargados.
- `DeleteProductModal`: confirmación + advertencia de borrado de imagen.
- Acciones rápidas en fila: +1 stock / -1 stock / toggle pausado.

### 8.3 Vista cliente (home público)

**Ruta**: `/` (server component).

**Layout mobile-first**:

- Header sticky: logo del kiosco + nombre "Kiosco de Gustavo" (configurable por env).
- Tabs/chips horizontales con scroll-snap: todas las categorías raíz. Sub-categorías anidadas o como tabs secundarias.
- Grid de productos (2 columnas mobile, 3-4 desktop): imagen (con lazy loading), nombre, precio, badge de stock ("Última unidad" si stock=1, "Quedan N" si stock>1, oculto si stock=0).
- Sin paginación inicialmente (pocos productos). Si crece, evaluar.
- Botón "Lo quiero!" en cada card → `https://wa.me/${NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`.
- Sin carrito. Sin login.

**Mensaje WhatsApp** (decidido: solo nombre del producto):

```
Hola Gustavo! Estoy interesado en: Funko Pop Spider-Man #142
```

El helper vive en `lib/shared/utils/whatsapp.ts`:

```ts
export function buildWhatsAppLink(phone: string, productName: string): string {
  const message = `Hola Gustavo! Estoy interesado en: ${productName}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

### 8.4 Cron job de limpieza

**Trigger**: Vercel Cron, configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-stock",
      "schedule": "0 6 * * *"
    }
  ]
}
```

> Cron en UTC. 03:00 ART (UTC-3) = 06:00 UTC. Ajustar si cambia el offset.

**Endpoint**: `app/api/cron/cleanup-stock/route.ts`

- Verifica header `Authorization: Bearer ${CRON_SECRET}` (Vercel lo manda automáticamente).
- Si no coincide, 401.
- Si coincide: busca productos con `stock = 0 AND stockZeroAt < (now - 30 days)`.
- Para cada uno: borra fila + imagen UploadThing.
- Loguea cuántos se borraron.
- Retorna 200 con `{ deletedCount, ids }`.

**Use case** (no es un action, es un script que vive en `lib/server/useCases/product.usecases.ts` o archivo aparte `lib/server/cron/cleanupStock.ts`):

```ts
export async function cleanupOldZeroStockProducts() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const candidates = await productRepository(db).findExpiredZeroStock({
    before: cutoff,
  });
  let deletedCount = 0;
  for (const product of candidates) {
    await productRepository(db).delete({ id: product.id });
    if (product.imageFileKey) await deleteUploadThingFile(product.imageFileKey);
    deletedCount++;
  }
  // Invalidar cache para que la home se refresque
  updateTag("kiosco:products");
  return { deletedCount, ids: candidates.map((p) => p.id) };
}
```

---

## 9. Fases de implementación

Plan tentativo. Cada fase termina con un entregable verificable (no necesariamente deployado, pero funcionando en local).

### Fase 0 — Setup base

- [ ] Inicializar Next.js 16.2+ con App Router y TypeScript strict.
- [ ] Instalar dependencias: `next-auth@beta`, `@auth/prisma-adapter`, `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg`, `zod`, `react-hook-form`, `@hookform/resolvers/zod`, `react-hot-toast`, `@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `uploadthing`, `@uploadthing/react`.
- [ ] Devs: `biome`, `@biomejs/biome`, `vitest`, `@playwright/test`.
- [ ] Copiar `biome.json` de carta-qr.
- [ ] Copiar `app/themes/THEME_DESIGN.md` y tokens.
- [ ] Setup `lib/env.ts` con Zod.
- [ ] Setup `lib/server/db/db.ts` (Prisma singleton).
- [ ] Setup Prisma init + schema inicial con `Category` y `Product`.
- [ ] Setup `next.config.ts` con `cacheComponents: true`.

**Entregable:** `pnpm dev` levanta, `pnpm typecheck` y `pnpm lint` pasan, página de placeholder.

### Fase 1 — Auth admin

- [ ] Configurar NextAuth con Google provider.
- [ ] Implementar whitelist en `authorized` callback.
- [ ] Página `/login` con botón "Continuar con Google".
- [ ] Página `/admin` placeholder con auth gate.
- [ ] Server action `signIn` y `signOut` (siguiendo excepciones documentadas de carta-qr).
- [ ] Toast en redirect cuando no estás en whitelist.

**Entregable:** Gustavo puede loguearse y ver `/admin`. Otra cuenta de Google es rechazada y va a `/`.

### Fase 2 — Categorías (CRUD)

- [ ] Entity files: schemas, types, repository, usecases, action.
- [ ] `createProtectedAction` adaptado a kiosco.
- [ ] UI admin: tabla + filtros + modales (Add/Edit/Delete).
- [ ] Validación de 2 niveles (subcategoría de subcategoría prohibida).
- [ ] Validación de borrado (no se puede borrar con productos).

**Entregable:** Gustavo puede crear/editar/borrar categorías con jerarquía de 2 niveles.

### Fase 3 — Productos (CRUD + imagen + stock)

- [ ] Entity files de Producto.
- [ ] Setup UploadThing (config + route handler).
- [ ] `ImageForm` en modal.
- [ ] Modo lazy upload con `resolveImageUpload` (adaptado a kiosco, sin `venueId`).
- [ ] Cleanup de imágenes en update/delete.
- [ ] UI admin: tabla con thumbnail, filtros, modales.
- [ ] Acciones rápidas: +1 / -1 stock, toggle pausado.

**Entregable:** Gustavo puede crear/editar/borrar productos con foto, nombre, descripción, precio, stock, categoría. Stock=0 oculta automáticamente al cliente.

### Fase 4 — Vista cliente

- [ ] Home `/` con grid de productos.
- [ ] Filtrado por categoría (tabs/chips).
- [ ] `ProductCard` con imagen, nombre, precio, badge de stock, botón WhatsApp.
- [ ] Helper `buildWhatsAppLink` en `lib/shared/utils/whatsapp.ts`.
- [ ] Header con logo y nombre del kiosco.

**Entregable:** Cliente entra a la home, ve productos, filtra por categoría, toca "Lo quiero!" y abre WhatsApp con mensaje pre-armado.

### Fase 5 — Cron job

- [ ] `vercel.json` con cron.
- [ ] Endpoint `/api/cron/cleanup-stock` con verificación de `CRON_SECRET`.
- [ ] Use case `cleanupOldZeroStockProducts`.
- [ ] Repository `findExpiredZeroStock`.
- [ ] Test manual del endpoint con `curl`.

**Entregable:** Productos con stock=0 hace >30 días se borran automáticamente, incluyendo imagen.

### Fase 6 — Deploy

- [ ] Crear proyecto Neon, obtener `DATABASE_URL`.
- [ ] Crear proyecto Vercel, conectar repo.
- [ ] Configurar env vars en Vercel.
- [ ] Configurar Google OAuth con redirect URI de producción.
- [ ] Primer deploy, smoke test en `*.vercel.app`.
- [ ] Comprar dominio `.com.ar` (cuando se decida).
- [ ] Configurar DNS.
- [ ] Configurar cron en producción.
- [ ] Smoke test final con Gustavo.

**Entregable:** App en producción accesible públicamente.

---

## 10. Variables de entorno

```bash
# === App ===
NEXT_PUBLIC_APP_URL="http://localhost:3000"    # dev. Prod: https://kiosco-gustavo.vercel.app
NEXT_PUBLIC_APP_NAME="Kiosco Lucas"           # nombre temporal, ver §11 — header + <title>
NEXT_PUBLIC_WHATSAPP_NUMBER="542234360228"     # E.164 sin +. 54 (AR) + 223 (MDQ) + 4360228

# === Auth ===
AUTH_SECRET=                                    # openssl rand -base64 32
AUTH_URL=                                       # Vercel completa
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS="lucasivancardozo27@gmail.com"    # whitelist Gustavo. Sumar CSV si hay backups.

# === DB ===
DATABASE_URL=                                   # dev: postgres local. Prod: connection string de Neon

# === UploadThing ===
UPLOADTHING_TOKEN=
UPLOADTHING_APP_ID=

# === Cron ===
CRON_SECRET=                                    # openssl rand -base64 32
```

---

## 11. Pendientes antes de implementación

Estado actualizado al cierre de la sesión de planificación. Los resueltos quedan registrados para auditoría.

- [x] **Número de WhatsApp real** — `542234360228` (E.164 sin `+`, AR + 223 + 4360228). Definido en sesión 2026-09-11.
- [x] **Email whitelist admin** — `lucasivancardozo27@gmail.com` (único por ahora). Más adelante se puede sumar CSV de respaldos sin redeploy.
- [x] **Nombre comercial** — `Kiosco Lucas` (temporal). Sustituir por el definitivo cuando se decida.
- [ ] **Logo del kiosco** — pendiente. Mientras tanto el header público mostrará texto plano o avatar genérico (decidir en Fase 4).
- [ ] **Google OAuth client + consent screen** — pendiente. Bloqueante para Fase 1. Crear client en Google Cloud Console con redirect URI `http://localhost:3000/api/auth/callback/google` (dev) y `https://kiosco-gustavo.vercel.app/api/auth/callback/google` (prod). Scopes: `openid email profile`.
- [ ] **Lista inicial de categorías** — pendiente, se carga en sesión de Fase 2.
- [ ] **Proyecto Neon** — pendiente. Se crea en Fase 6 (deploy). Hasta entonces, dev usa PostgreSQL local.

---

## 12. Convenciones (heredadas de carta-qr)

- **Código en inglés**, UI y mensajes de error en **español** rioplatense.
- **Commits:** conventional commits con scope. Ejemplos: `feat(admin): add product CRUD`, `fix(cron): handle empty candidates list`, `chore(deps): bump next-auth`.
- **Imports:** `@/*` alias; external → internal (`@/`) → relative.
- **Biome:** semicolons, single quotes, trailing commas, `lineWidth: 100`, 2-space indent. CSS excluido.
- **Comments:** ninguno salvo que se pida explícitamente. Self-documenting code.
- **No unused bindings** (prefijo `_` si es intencional).
- **Errors:** server actions retornan `ActionResult` `{ success, data, error }`. Errores Zod formateados como `path 🡆 message`.
- **No realtime, no Soketi, no websockets.** Toda actualización es vía cache + `updateTag`.

---

## 13. Testing (opcional, recomendado para MVP+)

Carta-qr usa Vitest (unit + integration con Prisma test DB) y Playwright (e2e). Para kiosco recomendamos:

- **Unit:** Vitest para use cases y repos (mockeando Prisma).
- **Integration:** Vitest con DB de test (Neon branch) para acciones protegidas.
- **E2E:** Playwright para flujos críticos: login admin → crear producto → ver en home → click WhatsApp.

No es bloqueante para MVP, pero documentar la estrategia antes de Fase 6.

---

## 14. Riesgos identificados

| Riesgo                                          | Mitigación                                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Gustavo olvida re-stockear antes de los 30 días | Notificación opcional (email/whatsapp) desde el cron cuando quedan 5 días para borrar. Diferido a Fase 5+. |
| Subida de imágenes pesadas                      | Validar tamaño (4MB) client + server side vía `MAX_UPLOAD_SIZE`. Patrón carta-qr.                          |
| Whitelist rota                                  | `ADMIN_EMAILS` se loguea en arranque para confirmar formato. Documentado en `lib/env.ts`.                  |
| Migración de DB en producción                   | Prisma migrations, nunca `db push` en prod. Branching de DB en Neon para PRs.                              |
| Cache stale en home                             | `updateTag('kiosco:products')` en cada action. Si aún hay stale, `router.refresh()` en el cliente.         |
| OAuth sin verificar en Google                   | Documentar pasos en Fase 6. Verificar antes de Fase 1 con email real.                                      |
| Cron se cae                                     | Vercel Cron tiene retry automático. Log de los runs. Si falla 3 veces, alert. Diferido.                    |

---

## 15. Out of scope (no se hace en MVP)

- Login de cliente / favoritos / wishlist.
- Carrito / checkout / pagos.
- Multi-kiosco / multi-tenant.
- Notificaciones push.
- Comentarios / reviews.
- Analytics / métricas de venta.
- Histórico de cambios de stock (tabla `StockMovement`). Diferido a futuro si Gustavo lo pide.
- Roles diferenciados (cajero, mozo). Solo admin único.
- Email transaccional.

---

## 16. Cómo usar este documento

- **Antes de cada sesión:** releer este archivo completo.
- **Después de cada decisión nueva:** actualizar acá primero, código después.
- **Antes de implementar una fase:** marcar su checklist, no saltar pasos.
- **Si se desvía el plan:** explicar por qué en el commit o en una nota al pie de este doc.

---

_Fin del documento. Próxima sesión: confirmar Fase 0 y arrancar._
