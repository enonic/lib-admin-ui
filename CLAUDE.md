# lib-admin-ui

## Scripts

- `pnpm check` — all quality gates (lint + types + test)
- `pnpm check:lint` — Biome linting
- `pnpm check:types` — TypeScript type checking (`tsc -b` + test project)
- `pnpm test` / `pnpm test:watch` — Vitest
- `pnpm fix` — Biome auto-fix
- `pnpm build` — dev build (alias for `build:dev`)
- `pnpm storybook` — Storybook dev server

## Linting

- **Tool**: Biome (`biome.json`)
- **Two-tier config**: relaxed rules for legacy `.ts` code, strict rules (via override) for new code
- **Strict override applies to**: `*.tsx`, `inputtype2/**/*.ts`, `ui2/**/*.ts`, `src/test/**`, `.storybook/**`, `*.config.ts`
- **Formatter**: disabled globally, enabled only in the strict override
- **Pre-commit hook** (`.husky/pre-commit`): `biome check --staged --no-errors-on-unmatched`
- `useSortedClasses` (nursery) enforces Tailwind class ordering in the strict override

## TypeScript

Dual-config architecture using project references:

- `tsconfig.base.json` — shared options: preact JSX, ES2023, bundler resolution
- `tsconfig.legacy.json` — `composite`, loose (`allowSyntheticDefaultImports`, `noImplicitReturns/This`), includes all `js/**/*.ts` + `js/**/*.tsx`
- `tsconfig.modern.json` — `composite`, `strict: true`, `isolatedModules`, includes only `*.tsx` + `inputtype2/**/*.ts` + `ui2/**/*.ts`, references legacy
- `tsconfig.test.json` — `noEmit`, incremental, references both legacy + modern

`tsc -b` builds legacy → modern via project references; `tsc -p tsconfig.test.json` type-checks tests.

Note: `tsc -b` runs in both `check:types` and `build:*:js`. Since Gradle runs check before assemble and tsc is incremental, the build invocation is always a no-op (~100ms). Not worth deduplicating.

## Code structure

- **Legacy code**: `js/ui/`, `js/form/inputtype/` — class-based, jQuery, loose TypeScript
- **Modern code**: `js/ui2/`, `js/form/inputtype2/` — Preact components (TSX), strict TypeScript, Tailwind CSS via `@enonic/ui`
- New code goes into `ui2/` and `inputtype2/`. Do not add new classes to legacy directories.
- `js/lib.ts` — entry point for the IIFE bundle

## Build

Vite dual-target setup (`vite.config.ts`):

- `BUILD_TARGET=js` — builds `js/lib.ts` → IIFE bundle (`lib.js`)
- `BUILD_TARGET=css` — builds Less stylesheets → CSS (with PostCSS: autoprefixer, cssnano, normalize, sort media queries)
- Both targets run in parallel via `pnpm --color /^build:(dev|prod):.*$/`
- Gradle integration: `pnpmCheck` → `pnpm check`, `pnpmBuild` → `pnpm build:(dev|prod)`
- `./gradlew yolo` — skips install, check, and test for fast iteration

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
