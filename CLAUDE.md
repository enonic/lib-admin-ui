# lib-admin-ui

## Testing

- **Framework**: Vitest (alongside legacy Jasmine specs)
- **Config**: `vitest.config.ts` (root), `tsconfig.test.json` (root)
- **Test location**: `src/test/**/*.test.ts`
- **Run**: `pnpm test` (single run), `pnpm test:watch` (watch mode)
- **Environment**: Node (pure logic tests, no DOM)
- Legacy Jasmine specs remain in `src/main/resources/assets/spec/` — do not mix

## Storybook

- **Config**: `.storybook/main.ts`
- **Run**: `pnpm storybook`
- **Framework**: `@storybook/preact-vite`

### Vite config constraints (viteFinal)

Three config blocks work together — all three are required:

1. **`resolve.alias`** — maps `react`/`react-dom` → `preact/compat`. Required because `@enonic/ui` imports from both `"preact"` and `"react"`.
2. **`resolve.dedupe`** — ensures Vite never loads multiple copies of preact subpackages.
3. **`optimizeDeps.include`** — forces Vite to pre-bundle `preact`, `preact/hooks`, `preact/compat`, and `@enonic/ui` together.

Why `optimizeDeps.include` and not `exclude`:
- `include` makes esbuild process `@enonic/ui` during pre-bundling, where aliases apply. This resolves `"react"` → `preact/compat` → same preact instance. It also converts CJS deps (like `focus-trap-react`) to ESM so named exports work.
- `exclude` was tried first but caused `focus-trap-react` CJS export failures — Vite can't convert CJS named exports without pre-bundling.
- Do NOT remove any of the three blocks or switch `include` to `exclude`.

### Tailwind CSS 4 (styles)

- `@tailwindcss/vite` plugin is added in `viteFinal` — this is how Tailwind 4 integrates with Vite.
- `.storybook/storybook.css` imports `tailwindcss`, `tw-animate-css`, and `@enonic/ui/preset.css`.
- `@source` directives tell Tailwind where to scan for class names (node_modules is excluded by default).
- Do NOT replace `@import "tailwindcss"` with granular layer imports unless legacy CSS layering is needed.
