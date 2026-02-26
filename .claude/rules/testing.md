---
paths:
  - "src/test/**/*.test.ts"
---

# Testing Standards

## Test Structure

Tests are pure unit tests in a Node environment — no DOM, no component rendering. Use the Arrange-Act-Assert pattern.

Result types expose `.success`, `.data`, and `.error` properties — test each branch explicitly:

```typescript
// Arrange
const result = await service.doSomething(input);

// Assert success branch
expect(result.success).toBe(true);
expect(result.data).toMatchObject({ id: expect.any(String) });

// Assert failure branch
expect(result.success).toBe(false);
expect(result.error.code).toBe('VALIDATION_ERROR');
```

## Builder Pattern for Test Data

Use builder functions (factory functions with overrides) to construct test data. Prefer specific helpers over generic factories.

```typescript
// ✅ Builder with sensible defaults and optional overrides
function buildFormValue(overrides?: Partial<FormValue>): FormValue {
  return {
    value: '',
    dirty: false,
    valid: true,
    ...overrides,
  };
}

// ✅ Named variants for common test scenarios
const invalidValue = buildFormValue({ valid: false, dirty: true });
```

## Mock Patterns

```typescript
// ✅ Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Test File Conventions

- Test files live in `src/test/**/*.test.ts`
- One `describe` block per module/class
- Nested `describe` for method/function grouping
- Test names start with `should`

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should return expected value for valid input', () => { /* ... */ });
    it('should throw when input is null', () => { /* ... */ });
  });
});
```

## Environment Notes

- **Runtime**: Node (no browser globals, no DOM)
- **Framework**: Vitest — use `vi` instead of `jest` for mocks and spies
- **No component testing**: `@testing-library/*` is not available; test logic directly
- **Legacy specs**: Jasmine specs in `src/main/resources/assets/spec/` — do not mix with Vitest tests
