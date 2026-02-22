# Testing Standards

## Test Structure

Tests are pure unit tests in a Node environment — no DOM, no component rendering. Use the Arrange-Act-Assert pattern.

```typescript
import { describe, it, expect, vi } from 'vitest';

// ✅ Arrange-Act-Assert pattern
describe('userService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData: UserData = {
        email: 'test@example.com',
        password: 'securePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockUser = { id: 'user_123', ...userData };
      vi.spyOn(userRepository, 'create').mockResolvedValue(mockUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.stringMatching(/^user_/),
        email: userData.email,
      });
    });

    it('should return error for invalid email', async () => {
      // Arrange
      const invalidData: UserData = {
        email: 'invalid-email',
        password: 'pass123!',
      };

      // Act
      const result = await userService.createUser(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## Builder Pattern for Test Data

Use builder functions (factory functions with overrides) to construct test data. Prefer specific helpers over generic factories.

```typescript
// ✅ Builder with sensible defaults and optional overrides
function buildUser(overrides?: Partial<User>): User {
  return {
    id: 'user_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ✅ Named variants for common test scenarios
const activeUser = buildUser({ status: 'active' });
const adminUser = buildUser({ role: 'admin', email: 'admin@example.com' });

// ✅ Nested builders for complex types
function buildFormValue(overrides?: Partial<FormValue>): FormValue {
  return {
    value: '',
    dirty: false,
    valid: true,
    ...overrides,
  };
}
```

## Mock Patterns

```typescript
import { vi } from 'vitest';

// ✅ Mock external dependencies with vi.mock
vi.mock('../services/EmailService', () => ({
  EmailService: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendPasswordReset: vi.fn().mockResolvedValue(true),
  },
}));

// ✅ Spy on methods for assertion
vi.spyOn(service, 'method').mockReturnValue(expectedResult);

// ✅ Reset mocks between tests when needed
beforeEach(() => {
  vi.clearAllMocks();
});

// ✅ Use vi.fn() for callback assertions
const onChangeMock = vi.fn();
callFunctionUnderTest(onChangeMock);
expect(onChangeMock).toHaveBeenCalledWith(expectedArg);
```

## Test File Conventions

```typescript
// ✅ Test files live in src/test/**/*.test.ts
// ✅ One describe block per module/class
// ✅ Nested describe for method/function grouping
// ✅ Test names start with 'should'

describe('ClassName', () => {
  describe('methodName', () => {
    it('should return expected value for valid input', () => { /* ... */ });
    it('should throw when input is null', () => { /* ... */ });
    it('should handle edge case correctly', () => { /* ... */ });
  });
});

// ✅ Use toEqual for deep equality, toBe for reference/primitive equality
expect(result).toEqual({ id: '1', name: 'Test' });
expect(flag).toBe(true);

// ✅ Use toThrow for error assertions
expect(() => parseValue(null)).toThrow('Value cannot be null');

// ✅ Use toMatchObject for partial object matching
expect(result).toMatchObject({ id: expect.any(String) });
```

## Environment Notes

- **Runtime**: Node (no browser globals, no DOM)
- **Framework**: Vitest — use `vi` instead of `jest` for mocks and spies
- **No component testing**: `@testing-library/*` is not available; test logic directly
- **Legacy specs**: Jasmine specs in `src/main/resources/assets/spec/` — do not mix with Vitest tests
