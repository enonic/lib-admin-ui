# lib-admin-ui

## Testing

- **Framework**: Vitest (alongside legacy Jasmine specs)
- **Config**: `vitest.config.ts` (root), `tsconfig.test.json` (root)
- **Test location**: `src/test/**/*.test.ts`
- **Run**: `pnpm test` (single run), `pnpm test:watch` (watch mode)
- **Environment**: Node (pure logic tests, no DOM)
- Legacy Jasmine specs remain in `src/main/resources/assets/spec/` — do not mix
