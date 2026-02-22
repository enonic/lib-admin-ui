# Preact Compatibility Notes

This project uses Preact in compatibility mode — `react` imports are aliased to `preact/compat` in the build config. Follow all standards from `react.md`; the notes below cover Preact-specific deviations only.

## Import Source

Always import from `react`, never from `preact` directly:

```typescript
// ✅ Correct
import { forwardRef, useState, type ReactElement, type ReactNode } from 'react';

// ❌ Wrong
import { forwardRef, useState, type ReactElement } from 'preact';
import type { ComponentChildren } from 'preact';
```

Use `ReactNode` for children — never `ComponentChildren`:

```typescript
// ✅
type Props = { children?: ReactNode };

// ❌
type Props = { children?: ComponentChildren };
```

Applies to component files, story files, and test files.

## React/Preact Compatibility Issues

### Radix UI Slot with forwardRef

When using `@radix-ui/react-slot` with Preact's `forwardRef`, the ref types don't align:

```typescript
export const Component = forwardRef<HTMLButtonElement, ComponentProps>(
  ({ asChild, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        // @ts-expect-error - Preact's ForwardedRef is incompatible with Radix UI Slot's expected ref type
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
```

- The ref works correctly at runtime — only types don't align
- Use `@ts-expect-error` with explanation, not `as any` or `as React.Ref<HTMLElement>`
- This is the primary known incompatibility; other Radix UI primitives work fine via `preact/compat`
