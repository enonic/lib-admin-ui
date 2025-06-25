---
paths:
  - "**/*.tsx"
---

# React Component Standards

## Component Structure

Prefer arrow functions over function declarations for components. Arrow functions require an explicit `displayName`.

```typescript
export type MyComponentProps = {
  title: string;
  active?: boolean;     // ✅ Drop is/has prefix for boolean props
  className?: string;   // ✅ className and children go last
  children?: ReactNode;
};

const MY_COMPONENT_NAME = 'MyComponent'; // used for displayName and data-component

export const MyComponent = ({
  title,
  active = false,
  className,
  children,
}: MyComponentProps): ReactElement => {
  // 1. Store/ref hooks first
  const data = useStore(myStore);

  // 2. State, memo, other hooks
  const [count, setCount] = useState(0);

  // 3. Effects last among hooks
  useEffect(() => { /* side-effect */ }, [data]);

  // 4. Derived state / business logic
  const isActive = data?.status === 'active';

  // 5. Class variables right before return
  const classNames = cn('p-4 rounded shadow', active && 'bg-blue-500', className);

  // 6. Early return (after class preparation)
  if (!data) return <LoadingIndicator />;

  return (
    <div data-component={MY_COMPONENT_NAME} className={classNames}>
      <h1>{title}</h1>
      {children}
    </div>
  );
};

MyComponent.displayName = MY_COMPONENT_NAME;
```

Rules:
- No default exports
- Always define and export Props from the same file, named `{ComponentName}Props`
- Put `className?` and `children?` last in Props definitions

## Early Return Best Practices

```typescript
// ❌ DON'T: Wrap conditional content in fragments
const MyContent = ({ isReady }: Props) => {
  return <>{isReady && <div>Content</div>}</>;
};

// ✅ DO: Return early with null/undefined
const MyContent = ({ isReady }: Props) => {
  if (!isReady) return null;
  return <div>Content</div>;
};
```

## Component Display Names & `data-component`

All exported components must have `displayName` set and `data-component` on the root element.

### Standard pattern

```typescript
const BUTTON_NAME = 'Button';

export const Button = ({ children, className }: ButtonProps): ReactElement => {
  return (
    <button data-component={BUTTON_NAME} className={className}>
      {children}
    </button>
  );
};

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
  'data-component': dataComponent = CONTENT_LABEL_NAME,
}: ContentLabelProps): ReactElement => {
  return (
    <ItemLabel
      data-component={dataComponent}
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

## Composable Components

Use the `Object.assign` pattern to create composable components with dot-notation API (e.g., `OccurrenceList.Item`). This follows the same conventions as `@enonic/ui` (Dialog, TreeList, Menu, etc.).

### Naming Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| Root component | `{Name}Root` | `ListRoot` |
| Subcomponents | `{Name}{Sub}` | `ListItem` |
| Composed export | `{Name}` | `List` |
| Root props type | `{Name}RootProps` | `ListRootProps` |
| Subcomponent props type | `{Name}{Sub}Props` | `ListItemProps` |

### Display Names

Use dot notation for `displayName` values:

```typescript
const LIST_ROOT_NAME = 'List.Root';
const LIST_ITEM_NAME = 'List.Item';

ListRoot.displayName = LIST_ROOT_NAME;
ListItem.displayName = LIST_ITEM_NAME;
```

### `data-component`

Use the base name (no `.Root` suffix) on the root element:

```typescript
const LIST_NAME = 'List';

// Inside ListRoot:
<div data-component={LIST_NAME}>...</div>
```

### Composition with Object.assign

Attach subcomponents and re-export root as `.Root`:

```typescript
export const List = Object.assign(ListRoot, {
    Root: ListRoot,
    Item: ListItem,
});
```

### Exports

Export composed component and all public prop types from `index.ts`:

```typescript
export {List, type ListItemProps, type ListRootProps} from './List';
```

### Internal Subcomponents

Subcomponents that are not attached to the composed export (e.g., `ListSortableItem`) are internal-only and get no `displayName`.

## useEffect: Initialization vs Update Gotcha

```typescript
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
```

## Refs in Dependency Arrays

```typescript
// ❌ DON'T: Put ref.current in dependency arrays
// Refs are mutable containers - React won't detect changes to .current
useEffect(() => {
  contentRef.current?.focus();
}, [contentRef.current]); // Wrong! .current changes don't trigger re-render

// ✅ DO: Omit from deps, check .current inside
useEffect(() => {
  contentRef.current?.focus();
}, []);

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
  }, refs);
}
```

## Extending Component Props

```typescript
// ✅ DO: Use ComponentPropsWithoutRef for standard components
type ButtonProps = {
  variant?: 'primary' | 'secondary';
} & ComponentPropsWithoutRef<'button'>;

// ✅ DO: Use ComponentPropsWithRef when forwarding refs
type InputProps = {
  label?: string;
} & ComponentPropsWithRef<'input'>;

// ❌ DON'T: Use ComponentProps (doesn't distinguish ref handling)
type BadProps = { value: string } & ComponentProps<'input'>;
```

## Performance Patterns

```typescript
// If store value is a map/object, subscribe to specific keys only
const { account } = useStore($application, {keys: ['account']});
```
