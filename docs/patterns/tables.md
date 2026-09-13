# Tables

UI pattern for admin tables. Adapted from carta-qr commit `3a6cd16` (where
the team migrated from a hand-rolled `<table>` to `@tanstack/react-table`),
trimmed to kioscoGustavo's single-tenant admin (no venue guards, no Soketi).

## Status vs carta-qr

- **carta-qr** has a shared primitive at `@/components/UI/Table` that wraps
  TanStack Table + filters + pagination + status badges + actions cell.
- **kioscoGustavo** is one phase behind: every table calls `useReactTable`
  inline. Two implementations is below the threshold where a shared
  primitive earns its keep — duplication is the deliberate trade-off. **If a
  third admin table lands, promote the common surface into
  `components/UI/Table`**, following the carta-qr pattern.

## Stack

- `@tanstack/react-table@^8.21.3` (`getCoreRowModel`, `getSortedRowModel`).
- Local sorting state via `useState<SortingState>([])`.
- Cells rendered with `flexRender(cell.column.columnDef.cell, cell.getContext())`.

## Template

```tsx
'use client';

export const MyTable = ({ data }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <span
          className={styles.sortable}
          onClick={column.getToggleSortingHandler()}
        >
          Nombre
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
        </span>
      ),
      cell: ({ row }) => row.original.name,
    },
    {
      id: 'actions',
      header: () => <span className={styles.srOnly}>Acciones</span>,
      cell: ({ row }) => (
        <div className={styles.actionsCell}>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDelete(row.original)}>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                Sin resultados.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
```

## Gotchas

### 1. Never `useOptimistic` with TanStack Table

`useOptimistic` (React 19 experimental) + TanStack Table + Next 16 cache
invalidation causes an infinite render loop that locks the browser. Two
stable alternatives — pick per UX need:

**Plain pattern** (`useTransition` + server action + `router.refresh()`):

```tsx
const router = useRouter();
const [pendingId, setPendingId] = useState<string | null>(null);

const handleAction = (id: string) => {
  startTransition(async () => {
    setPendingId(id);
    const result = await serverAction({ id });
    if (!result.success) {
      setPendingId(null);
      toast.error(result.error.message);
      return;
    }
    setPendingId(null);
    router.refresh();
  });
};
```

**Snappy pattern** (local mirror + sync on server arrival):

```tsx
const [rows, setRows] = useState(data);
useEffect(() => {
  setRows(data);
}, [data]);

const handleAction = (id: string) => {
  setRows((prev) => /* optimistic mutation */);
  startTransition(async () => {
    const result = await serverAction({ id });
    if (!result.success) {
      setRows((prev) => /* rollback */);
      return;
    }
    router.refresh();
  });
};
```

ProductsTable uses the snappy pattern (`useState` + `useEffect`) because
+/- stock needs to feel instant.

### 2. Never `useMemo(columns, [deps])`

Any `useMemo(columns, [...mutable])` (e.g. `[applyOptimistic]`) destabilizes
the columns identity, TanStack re-initializes, which triggers re-renders,
which destabilize the deps — loop. Declare `columns` as an inline literal.
TanStack re-derives rows from `data` every render anyway, so the memo
saved nothing.

### 3. CSS rows need `border-top` on `<tr>`, not on `<td>`

With `border-collapse: collapse`, `border-bottom` on `<td>` can render
inside the cell and get clipped by descendants with `overflow: hidden`
(ellipsis cells). The safe pattern is to put the inter-row line on
`tbody tr { border-top: 1px solid }` — that edge sits in a different
shared-border slot that survives overflow children.

**Last row closing line**: drop the `tr:last-child { border-top: 0 }`
reset (it left the table without a closing line, because the
`tableWrapper` border-bottom sits too far away, after the cell padding
plus `border-radius`). Give the last row an explicit `border-bottom`
instead:

```css
.table tbody tr {
  border-top: 1px solid var(--color-border);
}
.table tbody tr:last-child {
  border-bottom: 1px solid var(--color-border);
}
```

## Canonical implementations

- **CategoriesTable** —
  `app/admin/categorias/_components/CategoriesTable.tsx` (5 columns, no
  filters, sort by name).
- **ProductsTable** —
  `app/admin/productos/_components/ProductsTable.tsx` (10 columns,
  category + status filters, image thumbnails, inline +/- stock with
  snappy local-mirror pattern, status toggle).

## Related

- Engram observations:
  - `tanstack-usememo-columns-loop`
  - `no-useoptimistic-with-tanstack`
  - `optimistic-updates-with-usestate`
  - `css-table-border-overflow-fix`
- carta-qr reference: [`docs/patterns/tables.md`](https://github.com/.../docs/patterns/tables.md)
  (multi-tenant version, with `useTableFilters` + shared `<Table>` primitive).
