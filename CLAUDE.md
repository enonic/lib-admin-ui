# lib-admin-ui

## Scripts

After making changes, run `pnpm check` to verify nothing is broken. If linting fails, run `pnpm fix` to auto-fix before re-checking.

| Intent | Command |
|--------|---------|
| Verify changes and auto-fix lint issues (default) | `pnpm check` |
| Types only | `pnpm check:types` |
| Lint only | `pnpm check:lint` |
| Run TS/CSS dev build with typechecking | `pnpm build:dev` |
| Full Gradle build (JS + CSS + Gradle tasks) | `./gradlew build -Penv=dev` |
| Fast Gradle build (skip install, check, test) | `./gradlew yolo` |

Only run `./gradlew build -Penv=dev` when the task specifically requires testing the Gradle build. For most changes, `pnpm check` is sufficient.

## Code Structure

- **Modern** (new code goes here): `js/ui2/` — Preact/TSX, strict TypeScript, Tailwind
- **Legacy** (do not add to): `js/ui/`, `js/form/inputtype/` — class-based, jQuery, loose TypeScript
- **The toolkit** ([npm-enonic-ui-toolkit](https://github.com/enonic/npm-enonic-ui-toolkit)) owns the property tree, the schema classes, the value classes and the Preact input types: import them from `@enonic/input-types`, `@enonic/ui-utils` and `@enonic/ui-types` directly. `js/form2/BaseInputType.ts` bridges a toolkit descriptor to a legacy `InputView`.

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

- **With issue**: use `<Issue Title> #<number>` — e.g. issue `Do fix` #10 becomes `Do fix #10`
- **Without issue**: capitalized plain-English description — e.g. `Add local Git worktrees ignore`, `Fix build`
- **Body** (optional): past tense, one line per change, 2–6 lines, backticks for code refs

### Pull Requests

- **Title**: use the exact same pattern as the commit title when linked to an issue (`<Issue Title> #<number>`)
- **Commit/PR title pair example**: issue `Do fix` #10 → commit `Do fix #10`, PR `Do fix #10`
- **Body**: concisely explain what and why, skip trivial details. No emojis. Separate all sections with one blank line.
  ```
  <summary of changes>

  Closes #<number>

  [Claude Code session](<link>)  ← optional

  <sub>*Drafted with AI assistance*</sub>
  ```
