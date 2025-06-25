---
paths:
  - "**/*.{ts,tsx}"
---

# Commenting Rules

_Read and apply these guidelines when adding comments to source files._

---

## 1. Special Single-Line Prefixes

- `// ! ` (red)
  Use for critical issues that demand immediate attention (bugs, security risks, breaking changes).

  ```ts
  // ! Potential race condition if fetch retries here
  ```

- `// ? ` (blue)
  Use for questions, uncertainties, clarifications, or rationale for unusual patterns.

  ```ts
  // ? May need to memoize this selector, when call become too heavy
  ```

- `// * ` (green)
  Use to delineate logical blocks in large files. Surround with blank comment lines.

  ```ts
  //
  // * REST Utils
  //
  ```

  In composite components, use to separate each subcomponent:

  ```tsx
  //
  // * MenuRoot
  //

  export type MenuRootProps = { /* ... */ };
  const MenuRoot = ({ /* ... */ }) => { /* ... */ };

  //
  // * MenuTrigger
  //

  export type MenuTriggerProps = { /* ... */ };
  const MenuTrigger = ({ /* ... */ }) => { /* ... */ };
  ```

- `// TODO: ` (orange)
  Use for actionable future work. Start with an imperative verb and, if possible, reference a GitHub issue or owner.
  ```ts
  // TODO: [#123] Replace mock with live API
  ```

> **Rule 1.1** Never combine prefixes (e.g. `// ! TODO`) - choose the one that best conveys intent.
> **Rule 1.2** Use green comments to separate subcomponents in composite components; avoid in simple components.
> **Rule 1.3** Section headers should be concise (<= 4 words) and help readers navigate large files.

## 2. Comment Placement & Density

- Comment only non-obvious logic: algorithms, work-arounds, edge-cases.
- Avoid commenting trivial code (simple getters/setters, obvious mappings).
- Prefer function-level JSDoc/TSDoc for public APIs instead of inline prose.
- Keep comments inside function bodies to a minimum; most context belongs in tests or docs.
- Keep comment lines <= 80 characters.

```ts
function binarySearch(haystack: number[], needle: number): number {
  // Guard against unsorted input arrays
  if (!isSorted(haystack)) {
    // ! Sorting here would hide the caller's bug
    throw new Error('Input must be pre-sorted');
  }
  // Standard binary-search implementation…
}

function toBeImplemented(): void {
  /* empty */
}
```

## 3. Extensive Explanatory Blocks

_When asked to "explain in detail" or produce teaching code:_

1. Begin with a high-level overview above the function/class.
2. For each non-trivial step, insert a `// ?` remark before the relevant line or block.
3. End with a summary of side-effects or complexity, if helpful.
4. Do not duplicate obvious code; focus on **why**, not **what**.

## 4. Maintenance Etiquette

- Update or delete comments when code changes; stale comments are worse than none.
- Promote resolved `// TODO:` items to commits and remove the tag.
- Convert answered `// ?` questions into documentation or ADRs once clarified.
