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

## Git & GitHub

No conventional commit prefixes. Plain descriptive language throughout.

### Issues

Unless asked for specific format by the user, use the default one:

- **Title**: plain descriptive text — e.g. `Add MyComponent to browse view`, `PublishDialog: add schedule button`
- **Body**: concisely explain what and why, skip trivial details
  ```
  <4–8 sentence description: what, what's affected, how to reproduce, impact>

  #### Rationale
  <why this needs to be fixed or implemented>

  #### References        ← optional
  #### Implementation Notes  ← optional

  <sub>*Drafted with AI assistance*</sub>
  ```

### Commits

- **With issue**: `<Issue Title> #<number>` — e.g. `Add MyComponent to browse view #12`
- **Without issue**: capitalized plain-English description — e.g. `Add local Git worktrees ignore`, `Fix build`
- **Body** (optional): past tense, one line per change, 2–6 lines, backticks for code refs

### Pull Requests

- **Title**: `<Issue Title> #<number>` — matches the commit title
- **Body**: concisely explain what and why, skip trivial details. No emojis. Separate all sections with one blank line.
  ```
  <summary of changes>

  Closes #<number>

  [Claude Code session](<link>)  ← optional

  <sub>*Drafted with AI assistance*</sub>
  ```
