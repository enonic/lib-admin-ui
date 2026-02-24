# lib-admin-ui

## Scripts

After making changes, run `pnpm check` to verify nothing is broken. If linting fails, run `pnpm fix` to auto-fix before re-checking.

| Intent | Command |
|--------|---------|
| Verify changes and auto-fix lint issues (default) | `pnpm check` |
| Types only | `pnpm check:types` |
| Lint only | `pnpm check:lint` |
| Run tests once | `pnpm test` |
| Run TS/CSS dev build with typechecking | `pnpm build:dev` |
| Build Storybook | `pnpm build-storybook` |
| Full Gradle build (JS + CSS + Gradle tasks) | `./gradlew build -Penv=dev` |
| Fast Gradle build (skip install, check, test) | `./gradlew yolo` |

**Do not run autonomously** (interactive / long-running — only if explicitly asked):
- `pnpm storybook` — dev server, runs until stopped
- `pnpm test:watch` — watch mode, runs until stopped

Only run `./gradlew build -Penv=dev` when the task specifically requires testing the Gradle build. For most changes, `pnpm check` is sufficient.

## Code Structure

- **Modern** (new code goes here): `js/ui2/`, `js/form/inputtype2/` — Preact/TSX, strict TypeScript, Tailwind
- **Legacy** (do not add to): `js/ui/`, `js/form/inputtype/` — class-based, jQuery, loose TypeScript

