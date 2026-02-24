---
paths:
  - "**/*.tsx"
  - ".storybook/**/*.{ts,tsx}"
---

# Tailwind CSS & Styling Standards

## Class Name Utilities

### `cn` (clsx/twMerge wrapper) - Default Choice

Import `cn` directly from `@enonic/ui`:

```typescript
import { cn } from '@enonic/ui';

// ✅ Use cn for most dynamic class combinations
const buttonClasses = cn(
  'px-4 py-2 rounded font-medium',
  disabled && 'opacity-50 cursor-not-allowed',
  variant === 'primary' && 'bg-blue-500 text-white',
  className,
);

// ✅ When using `className` prop, pass it as the last argument in cn()
// This allows parent components to override styles
const classes = cn(
  'base-styles',
  condition && 'conditional-styles',
  className, // Last, so parent can override
);

// ❌ Don't place className before other classes - overrides won't work
const badClasses = cn(className, 'base-styles');

// ❌ Don't use template literals for Tailwind classes
```

### `cva` - Only for Complex Variants

```typescript
// ✅ Use cva ONLY when you have 2+ variant dimensions with multiple options
const buttonVariants = cva('px-4 py-2 rounded font-medium transition-colors', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    },
    size: {
      sm: 'text-sm px-3 py-1',
      md: 'text-base px-4 py-2',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

// ❌ DON'T use cva for simple true/false states
const badVariants = cva('base', {
  variants: {
    disabled: { true: 'opacity-50', false: '' },
  },
});
```

## Tailwind 4 Best Practices

### Color System

```typescript
// ✅ Use semantic color tokens when available
<div className="bg-primary text-primary-foreground" />

// ✅ Use Tailwind class names directly for theme colors
<div className="bg-overlay backdrop-blur-xs" />

// ❌ Avoid arbitrary CSS variable syntax
<div className="bg-[var(--color-overlay)]" /> // Use bg-overlay instead

// ❌ Avoid arbitrary values when design tokens exist
<div className="bg-[#3B82F6]" /> // Use bg-blue-500 instead
```

### Spacing & Layout

```typescript
// ✅ Use size-* for equal width and height
<Icon className="size-4" /> // Not h-4 w-4

// ✅ Use logical properties
<div className="ps-4 me-2" /> // padding-start, margin-end

// ✅ Consistent gap usage in flex/grid
<div className="flex gap-4" /> // Not space-x-4

// ✅ Use container queries where appropriate
<div className="@container">
  <div className="@lg:grid-cols-3" />
</div>
```

## Class Name Management

### When to Extract Classes to Variables

**Extract to variables when:**

- Complex conditional logic (multiple variants, multiple conditions)
- More than 6 classes on a single line, 4+ lines, or 80+ characters
- Reused in 2+ places in the same file

**Keep inline when:**

```typescript
// ✅ Simple static classes (up to 5)
<div className="flex items-center gap-2" />

// ✅ Single simple condition
<button className={cn('px-4 py-2', disabled && 'opacity-50')} />
```

### Compose Base Styles

```typescript
// ✅ Base styles + modifications
const baseButton = 'px-4 py-2 rounded font-medium transition-colors';
const primaryButton = cn(baseButton, 'bg-blue-500 text-white hover:bg-blue-600');
const secondaryButton = cn(baseButton, 'bg-gray-200 hover:bg-gray-300');
```

**Decision framework:**

- Keep classes close to usage but after all logic
- Extract when readability suffers in JSX
- Extract when you start duplicating combinations
- Follow the flow: hooks → logic → styles → render

## Component Styling Patterns

### State Management with Data Attributes

```typescript
// ✅ Use data-* attributes for state-based styling
<li
  data-active={isActive}
  data-selected={isSelected}
  className="option data-[active=true]:bg-surface-neutral-hover data-[selected=true]:bg-surface-primary"
>
  Option
</li>

// ❌ Avoid complex class-based state selectors
<li
  className={cn(
    'option',
    isActive && 'option-active',
    isSelected && 'option-selected'
  )}
>
  Option
</li>
```

### Dark Mode

```typescript
// ✅ CSS variables are used for theming, dark mode is handled by the theme provider
<div className="bg-background text-foreground" />
```

## Anti-patterns to Avoid

```typescript
// ❌ String concatenation for classes
<div className={'text-' + size} /> // Breaks Tailwind's compiler

// ❌ Conditional full class names in templates
<div className={`${active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`} />
// ✅ Use cn() instead

// ❌ Mixing Tailwind with inline styles
<div className="p-4" style={{ margin: '10px' }} />

// ❌ Using @apply in component files
// @apply should only be in CSS files for base styles; use cn() or cva() in components

// ❌ Using important modifier everywhere
<div className="!p-4 !m-2 !text-center" /> // Fix specificity properly
```
