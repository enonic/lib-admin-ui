# React Component Standards

## Component Structure

Prefer arrow functions over function declarations for components. Arrow functions require an explicit `displayName`.

```typescript
// ✅ Prefer arrow functions with explicit return type
// ✅ Define and export Props from the same component's file
// ✅ Always add component name before Props, e.g. `ButtonProps` for `Button` component
// ❌ Avoid using default export in component file

export type MyComponentProps = {
  title: string;
  // ✅ Drop prefixes for boolean flags
  active?: boolean;
  // ✅ Put `className?` and `children?` last in the Props definition
  className?: string;
  children?: ReactNode;
};

// ✅ Define name as a const — used for displayName and data-component
const MY_COMPONENT_NAME = 'MyComponent';

export const MyComponent = ({
  title,
  active = false,
  className,
  children,
}: MyComponentProps): ReactElement => {
  // ✅ Hoist store/ref hooks at the very top
  const data = useStore(myStore);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Other hooks next: state, memo, effects, etc.
  const [count, setCount] = useState(0);
  const expensive = useMemo(() => heavyCalc(data), [data]);

  // ✅ Effects are last hooks, if possible
  useEffect(() => { /* side-effect */ }, [data]);

  // ✅ If className list grows long, factor into `classNames` before return
  const classNames = cn(
    'p-4 rounded shadow',
    active && 'bg-blue-500',
    className,
  );

  // ✅ Early return for loading / error / guard clauses
  if (!data) return <LoadingIndicator />;

  // ✅ Set data-component on root element; set ARIA attributes where appropriate
  return (
    <div
      data-component={MY_COMPONENT_NAME}
      ref={containerRef}
      className={classNames}
      aria-pressed={active}
      role='button'
    >
      <h1>{title}</h1>
      {children}
    </div>
  );
};

MyComponent.displayName = MY_COMPONENT_NAME;
```

## Early Return Best Practices

```typescript
    const MyContent = ({ isReady }: Props) => {
    // ✅ Prefer early return over conditional fragments
    // ❌ DON'T: Wrap conditional content in fragments
    return <>{isReady && <div>Content</div>}</>;

    // ✅ DO: Return early with null/undefined
    if (!isReady) return null;
    return <div>Content</div>;
};
```

## Variable Placement in Components

```typescript
export function MyComponent({ variant, disabled, className }: Props) {
  // 1️⃣ Hooks always first
  const [isOpen, setIsOpen] = useState(false);
  const data = useQuery();

  // 2️⃣ Derived state and business logic
  const isActive = data?.status === 'active';
  const showWarning = isActive && !disabled;

  // 3️⃣ Class variables - right before return/early returns
  const containerClasses = cn(
    'relative p-6 rounded-lg',
    isActive && 'ring-2 ring-blue-500',
    className,
  );

  const buttonClasses = cn(
    'px-4 py-2 font-medium',
    variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200',
  );

  // 4️⃣ Early returns after class preparation
  if (!data) return <Loading />;

  // 5️⃣ JSX with prepared variables
  return (
    <div className={containerClasses}>
      <button className={buttonClasses}>
        Click me
      </button>
    </div>
  );
}
```

## Component Display Names & `data-component`

All exported components must have `displayName` set and `data-component` on the root element.

### Standard pattern

```typescript
// ✅ Define name const at module top
const BUTTON_NAME = 'Button';

// ✅ Arrow function with explicit return type
export const Button = ({ children, className }: ButtonProps): ReactElement => {
  return (
    <button data-component={BUTTON_NAME} className={className}>
      {children}
    </button>
  );
};

// ✅ Set displayName using the same const
Button.displayName = BUTTON_NAME;
```

### Overridable `data-component` for foundational components

When a component is composable or used as a building block (e.g., input types, label wrappers), let callers override `data-component` by destructuring it from props with the const as default:

```typescript
const CONTENT_LABEL_NAME = 'ContentLabel';

export type ContentLabelProps = {
  content: Content;
  className?: string;
  'data-component'?: string; // ✅ Explicitly allow override
};

export const ContentLabel = ({
  content,
  className,
  'data-component': dataComponent = CONTENT_LABEL_NAME, // ✅ Default to own name
}: ContentLabelProps): ReactElement => {
  return (
    <ItemLabel
      data-component={dataComponent} // ✅ Passed through, can be overridden by caller
      primary={content.getDisplayName()}
      className={className}
    />
  );
};

ContentLabel.displayName = CONTENT_LABEL_NAME;
```

### memo() and forwardRef()

```typescript
// ✅ memo(): set displayName on the result
const BUTTON_NAME = 'Button';
export const Button = React.memo(({ items }: Props) => <ul>...</ul>);
Button.displayName = BUTTON_NAME;

// ✅ forwardRef(): set displayName on the result
const INPUT_NAME = 'Input';
export const Input = React.forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input data-component={INPUT_NAME} ref={ref} {...props} />
));
Input.displayName = INPUT_NAME;
```

### HOCs

```typescript
// ✅ HOCs: set displayName with wrapper info
const withAuth = <P,>(Component: React.ComponentType<P>) => {
  const Wrapped = (props: P) => { /* ... */ };
  Wrapped.displayName = `withAuth(${Component.displayName || Component.name})`;
  return Wrapped;
};
```

**Rules:**

- Every exported arrow-function component needs `displayName` — always via a named const
- Set `data-component` on the root element so devtools and tests can locate the component
- For foundational/composable components, expose `'data-component'?: string` in props so callers can override it
- `data-component` should be placed before spread props (`{...props}`) so it is not accidentally overridden unless explicitly intended

## useEffect Best Practices

```typescript
// ❌ DON'T: Transform data for rendering
function TodoList({ todos, filter }) {
  const [visibleTodos, setVisibleTodos] = useState([]);
  useEffect(() => {
    setVisibleTodos(todos.filter(todo => todo.status === filter));
  }, [todos, filter]); // Unnecessary effect!
}

// ✅ DO: Calculate during render
function TodoList({ todos, filter }) {
  const visibleTodos = todos.filter(todo => todo.status === filter);
  // Or useMemo if expensive: useMemo(() => todos.filter(...), [todos, filter])
}

// ❌ DON'T: Handle user events
function Form() {
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (submitted) {
      sendAnalytics('form_submit');
      // ... more submission logic
    }
  }, [submitted]); // Wrong pattern!
}

// ✅ DO: Use event handlers directly
function Form() {
  const handleSubmit = () => {
    sendAnalytics('form_submit');
    // ... submission logic
  };
}

// ❌ DON'T: Reset state when prop changes
function ProfilePage({ userId }) {
  const [comment, setComment] = useState('');
  useEffect(() => {
    setComment(''); // Reset comment when user changes
  }, [userId]); // Can be better!
}

// ✅ DO: Use key prop to reset component state
function ProfilePage({ userId }) {
  return <Profile key={userId} userId={userId} />;
  // Component remounts, state resets automatically
}

// ❌ DON'T: Update state based on props/state changes
function UserCard({ firstName, lastName }) {
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
  }, [firstName, lastName]); // Redundant state sync!
}

// ✅ DO: Calculate during render
function UserCard({ firstName, lastName }) {
  const fullName = `${firstName} ${lastName}`; // Just derive it
}

// ❌ DON'T: Early return that blocks re-execution
function ComboBox({ items }) {
  const instanceRef = useRef(null);
  useEffect(() => {
    if (instanceRef.current) return; // Bug! When items changes, effect exits early
    instanceRef.current = createInstance();
    instanceRef.current.setItems(items); // Never called on items change!
  }, [items]);
}

// ✅ DO: Separate initialization from updates
function ComboBox({ items }) {
  const instanceRef = useRef(null);
  useEffect(() => {
    if (!instanceRef.current) {
      instanceRef.current = createInstance();
    }
    instanceRef.current.setItems(items); // Always runs when items changes
  }, [items]);
}

// ✅ CORRECT uses of useEffect:
// External system sync
useEffect(() => {
  const ws = new WebSocket(url);
  ws.connect();
  return () => ws.disconnect();
}, [url]);

// Data fetching (though prefer React Query/SWR)
useEffect(() => {
  fetch(`/api/user/${userId}`)
    .then(res => res.json())
    .then(setUser);
}, [userId]);

// Analytics/logging after render
useEffect(() => {
  logPageView(pathname);
}, [pathname]);
```

## useCallback Best Practices

```typescript
// ❌ DON'T use useCallback when:
// - Not passed to memo() components
// - Not used as dependency in hooks
// - Function doesn't capture scope values
const handleClick = useCallback(() => console.log('click'), []); // Unnecessary!

// ✅ DO use useCallback when:
// - Passing to memo() components
const handleClick = useCallback(() => setCount(c => c + 1), []);
return <MemoizedButton onClick={handleClick} />;

// - Function is dependency of other hooks
const fetchData = useCallback(() => fetch(url), [url]);
useEffect(() => { fetchData() }, [fetchData]);
```

## useMemo Best Practices

```typescript
// ❌ DON'T use useMemo for:
// - Simple calculations
const sum = useMemo(() => a + b, [a, b]); // Overkill!
// - Primitives that aren't dependencies
const name = useMemo(() => user.name, [user.name]); // Unnecessary!

// ✅ DO use useMemo for:
// - Expensive calculations (filtering/sorting large arrays)
const filtered = useMemo(() => bigArray.filter(...).sort(...), [bigArray]);

// - Objects/arrays passed to memo() children or used as dependencies
const options = useMemo(() => ({ sort: true, filter }), [filter]);
return <MemoizedList options={options} />;
```

## Refs in Dependency Arrays

```typescript
// ❌ DON'T: Put ref.current in dependency arrays
// Refs are mutable containers - React won't detect changes to .current
useEffect(() => {
  contentRef.current?.focus();
}, [contentRef.current]); // Wrong! .current changes don't trigger re-render

// ✅ DO: Use ref object (stable) or omit from deps, check .current inside
useEffect(() => {
  contentRef.current?.focus();
}, []); // Or [contentRef] if you need the ref object itself

// ❌ DON'T: Wrap arrays in another array
// Creates new array reference every render, defeating memoization
function useComposedRefs<T>(...refs: Ref<T>[]) {
  return useCallback((node: T) => {
    refs.forEach(ref => setRef(ref, node));
  }, [refs]); // Wrong! [refs] !== [refs] on every render
}

// ✅ DO: Use array directly as deps (with biome-ignore if needed)
function useComposedRefs<T>(...refs: Ref<T>[]) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs spread as deps
  return useCallback((node: T) => {
    refs.forEach(ref => setRef(ref, node));
  }, refs); // Correct - array used directly
}

// ✅ Ref objects from useRef() are stable - safe to include
const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  // containerRef is stable, containerRef.current may change
  containerRef.current?.focus();
}, [containerRef]); // OK but usually unnecessary since ref is stable
```

**Rules:**

1. **Never `ref.current`** - Refs are mutable, changes don't trigger re-renders
2. **Never `[array]`** - Wrapping an array creates a new reference each render
3. **Ref objects are stable** - `const ref = useRef()` creates a stable reference
4. **Rest parameters** - Use the array directly with lint suppression if needed

## Extending Component Props

```typescript
// ✅ DO: Use ComponentPropsWithoutRef for standard components
import { ComponentPropsWithoutRef } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
} & ComponentPropsWithoutRef<'button'>;

export function Button({ variant = 'primary', loading, ...props }: ButtonProps) {
  return <button {...props} />;
}

// ✅ DO: Use ComponentPropsWithRef when forwarding refs
import { ComponentPropsWithRef, forwardRef } from 'react';

type InputProps = {
  label?: string;
  error?: string;
} & ComponentPropsWithRef<'input'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return <input ref={ref} {...props} />;
  }
);

// ❌ DON'T: Use ComponentProps (doesn't distinguish ref handling)
type BadProps = { value: string } & ComponentProps<'input'>; // Avoid

// ❌ DON'T: Use specific HTML attribute types
type BadButtonProps = { variant: string } & ButtonHTMLAttributes<HTMLButtonElement>; // Verbose
type BadDivProps = { layout: string } & HTMLAttributes<HTMLDivElement>; // Unnecessary
```

## Performance Patterns

```typescript
// 1️⃣ Keep renders cheap & predictable
// ✅ Split UI into small, pure components; wrap heavy ones in React.memo
const ImageGrid = React.memo(function ImageGrid({ images }: { images: Image[] }) {
  return images.map(img => <img key={img.id} src={img.src} />);
});

// 2️⃣ `useMemo` only for **expensive** calculations or reference-equality
// ✅ Heavy work
const sorted = useMemo(() => heavySort(list), [list]);  // good
// ❌ Cheap math doesn't need it
const sum = a + b;                                      // simpler + faster

// 3️⃣ `useCallback` only when a child​/​hook depends on function identity
// ✅ Stable handler passed to memoized child
const handleSave = useCallback((u: User) => onSave(u), [onSave]);
<SaveButton onClick={handleSave} />;

// ❌ Redundant inside same component scope
<button onClick={() => onSave(user)}>Save</button>      // fine—re-creation is cheap

// 4️⃣ Prefer `useEffect`; reserve `useLayoutEffect` for sync DOM reads/writes
// ✅ Measure before paint, then mutate quickly
useLayoutEffect(() => {
  const rect = ref.current!.getBoundingClientRect();
  setPos(rect.top);
}, []); // keep work minimal & cleanup promptly

// 5️⃣ Throttle / debounce high-frequency events (scroll, resize)
// ✅ Check and apply to cases, where no fast/instant feedback is needed
const throttledScroll = useCallback(throttle(handleScroll, 100), [handleScroll]);

// 6️⃣ If store is a map, listen for the used keys only
const { account } = useStore($application, {keys: ['account']});
```
