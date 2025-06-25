---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript Coding Standards

## Code Style

```typescript
// ✅ Check for both null and undefined with `!= null`
if (response != null) {
  // safe to use response
}

// ❌ No nested ternaries - use if/else or object lookup
const status = isLoading ? 'loading' : isError ? 'error' : 'idle'; // Bad

// ✅ Good alternatives
const status = getStatus(); // Extract to function with if/else or switch/case

// ✅ Leverage modern TypeScript syntax
const len = items?.length ?? 0;
settings.debug ||= false;
cache?.clear();
const size = 1_000;

// ✅ Prefer destructuring assignment
const [body, headers = {}] = request;
const { signal } = new AbortController();

// ✅ Prefer single-line guard clauses (early return)
if (element == null) return;
if (!isSupported) return false;

// ❌ Do not wrap single-statement guard clauses in braces
if (data == null) {
  return;
}

// ✅ Insert exactly one blank line between logically distinct operations
const result = doSomething();

updateAnotherThing();

```

## Naming Standards

```typescript
// ✅ All stores must start with `$` sign
export const $counter = atom(0);

// ✅ Standalone booleans use `is`/`has`/`can`/`should`/`will` prefixes
const isEnabled = true;
const hasFocus = false;
const canEdit = permissions.includes('edit');

// ✅ Object props: drop prefixes for boolean props
const state = { enabled: true };

// ✅ React props: drop prefixes for boolean props
interface ButtonProps {
  disabled?: boolean; // Not 'isDisabled'
  loading?: boolean;  // Not 'isLoading'
  active?: boolean;   // Not 'isActive'
  onClick?: () => void;
  onChange?: (value: string) => void;
}

// ✅ Internal handlers use 'handle' prefix
const handleClick = () => { onClick?.(); };

// ✅ Use standard prop names
interface InputProps {
  value?: string;         // Not 'text' or 'content'
  defaultValue?: string;  // Not 'initialText'
  onChange?: (value: string) => void; // Not 'onUpdate'
}

// ✅ Arrays use plural forms
const users: User[] = [];

// ✅ Functions use verb prefixes
function getUserById(id: string) {} // get/fetch/load/parse
function isValidEmail(email: string) {} // is/has for boolean returns

// ✅ Name constants using UPPERCASE and underscore
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
```

## Type Definitions

```typescript
// ✅ Prefer types for object shapes
type User = {
  id: string;
  name: string;
}

// ✅ Use type aliases for unions/primitives
type UserStatus = 'active' | 'inactive' | 'pending';

// ✅ Use T[] syntax for arrays
type Users = User[];
const items: string[] = [];

// ❌ Avoid Array<T> generic syntax
type Users = Array<User>; // Bad

// ❌ Avoid any type - use unknown and type guards
const data: unknown = fetchData();
if (isUser(data)) { /* TypeScript knows data is User here */ }

// ❌ Avoid type assertions with 'as' - use type guards or proper typing
const user = {} as User; // Bad
// ✅ Good alternatives
const user: Partial<User> = {};
if (event.target instanceof HTMLInputElement) { /* use target */ }

// ❌ Avoid non-null assertion '!' - use optional chaining or guards
const value = getUserInput()!; // Bad
// ✅ Good alternatives
const value = getUserInput() ?? defaultValue;

// ✅ Use `satisfies` for precise literal types without widening
const options = {
  retry: 3,
  timeout: 5000,
} satisfies RequestOptions;

// ✅ Define and use `Maybe<T>` for nullish values
type Maybe<T> = T | null | undefined;
function findUser(id: string): Maybe<User> { /* ... */ }

// ✅ Prefer `undefined` over `null` for unset values
const [activeId, setActiveId] = useState<string | undefined>(undefined);
const context = createContext<MenuContextValue | undefined>(undefined);

// ❌ Avoid `null` for optional/unset values
const [activeId, setActiveId] = useState<string | null>(null); // Bad

// ✅ Exception: refs use `null` (React convention)
const ref = useRef<HTMLDivElement | null>(null);
```

**Rationale for `undefined` over `null`:**
- `undefined` is JavaScript's default for uninitialized values
- Consistent with TypeScript optional properties (`prop?: string`)

## Type Composition

```typescript
// ✅ Use regular imports for types
import { MenuContextOperations } from '../primitives/menu-primitive';

export type MenuItemProps = Omit<MenuPrimitiveItemProps, keyof MenuContextOperations>;

// ❌ Avoid inline/dynamic type imports - harder to read and refactor
export type MenuItemPropsBad = Omit<
  MenuPrimitiveItemProps,
  keyof import('../primitives/menu-primitive').MenuContextOperations
>;

// ✅ Prefer composition: define base "own" types, then extend
type MenuItemOwnProps = {
  id?: string;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
} & ComponentPropsWithoutRef<'div'>;

// Internal type combines base + injected dependencies
type MenuPrimitiveItemProps = MenuItemOwnProps & MenuContextOperations;

// Consumer type uses base directly - clean and readable
export type MenuItemProps = MenuItemOwnProps;

// ❌ Avoid subtracting types that were just added (Omit gymnastics)
type FullProps = BaseProps & InjectedDeps;
export type PublicProps = Omit<FullProps, keyof InjectedDeps>; // Bad - just use BaseProps

// ❌ Especially avoid nested Omit - very hard to understand
export type RadioItemProps = Omit<
  PrimitiveRadioItemProps,
  keyof Omit<MenuContextOperations, 'setOpen'>
>; // Bad

// ✅ Instead, define what you need directly (single-level Omit is fine)
type RadioItemOwnProps = { value: string; disabled?: boolean; /* ... */ };
type PrimitiveRadioItemProps = RadioItemOwnProps & Omit<MenuContextOperations, 'setOpen'>;
export type RadioItemProps = RadioItemOwnProps; // Clean
```

**Rationale:**
- IDE hover shows actual properties instead of computed `Omit<...>` types
- TypeScript errors reference real property names, not derived types
- Nested `Omit<X, keyof Omit<Y, 'z'>>` is a code smell — restructure the types

## Function Signatures

```typescript
// ✅ Explicit return types for public functions
export function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Error Handling

```typescript
// ✅ Use Result pattern to wrap operations that are unsafe
async function parse(data: string): <Result<User>> {
  return Result.tryCatch((): unknown => JSON.parse(data));
}
```

- `Result`, `Ok`, `Err` have custom implementations inside the project.

## Import/Export Standards

- Named exports preferred; avoid default exports in component files.
