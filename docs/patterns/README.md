# UI patterns

UI patterns specific to kioscoGustavo. Server-side patterns (entity files,
server actions, cache tags) stay in [AGENTS.md](../../AGENTS.md#patterns) until
they accumulate enough detail to deserve their own file. UI patterns like
tables, forms and modals also have a brief one-line entry in AGENTS.md's
`### UI patterns` section; this folder holds the detail.

## Entries

- [tables.md](tables.md) — `@tanstack/react-table` v8, column/row patterns,
  React 19 + Next 16 gotchas, CSS row border pattern.

## Adding a new entry

1. Create `<pattern>.md` at this level with the detail.
2. Add a one-line bullet to [AGENTS.md](../../AGENTS.md)'s
   `### UI patterns` section pointing to the new file.
3. Add a bullet to the entries list above.
