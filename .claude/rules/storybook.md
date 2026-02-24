---
paths:
  - "**/*.stories.tsx"
  - ".storybook/**/*.{ts,tsx}"
---

# Storybook Stories Standards

## Story Organization & Grouping

Use hierarchical grouping with `/` separator to organize stories:

```typescript
// ✅ DO: Group stories by purpose using slash separator
export const Basic: Story = {
  name: 'Examples / Basic',
  render: () => <Component />
};

export const Disabled: Story = {
  name: 'States / Disabled',
  render: () => <Component disabled />
};

export const AlignEnd: Story = {
  name: 'Features / Align End',
  render: () => <Component align='end' />
};

export const FocusNavigation: Story = {
  name: 'Behavior / Focus Navigation',
  render: () => <Component />
};

// ❌ DON'T: Use flat structure without grouping
export const BasicExample: Story = { name: 'Basic Example' };
```

### Standard Groups

Use these standard groups in order:

1. **Examples** - Basic usage patterns for newcomers
2. **States** - Visual states of the component
3. **Features** - Specific capabilities and configurations
4. **Behavior** - Interaction patterns and accessibility
5. **Radio/Checkbox/Select** - Specialized component variants

## Interactive Playground

Create an "Interactive" story for components with meaningful configurable props:

- ✅ Create when component has 2+ variant props with multiple options
- ❌ Skip for components with only a single boolean prop

## Story Wrapper Styling

```typescript
// ✅ DO: Use standard wrapper with helpful description
export const Example: Story = {
  name: 'Examples / Basic',
  render: () => (
    <div className='flex flex-col gap-y-3 p-4 items-center'>
      <div className='max-w-120 text-sm text-subtle'>
        Brief description of what this story demonstrates or how to interact with it.
      </div>
      <Component />
    </div>
  ),
};

// ✅ DO: Use minimal wrapper when component is self-contained
export const Simple: Story = {
  name: 'Examples / Simple',
  render: () => <Component />
};

// ❌ DON'T: Add excessive wrapper divs without purpose
// ❌ DON'T: Use fixed widths that break responsive design
```

## State Management in Stories

- ✅ Use local state for interactive stories
- ❌ Don't use external state management (nanostores) in stories

## Vite Config Constraints (`viteFinal`)

Three config blocks are required and interdependent — **do not remove any**:

1. `resolve.alias` — maps `react`/`react-dom` → `preact/compat`
2. `resolve.dedupe` — prevents duplicate preact instances
3. `optimizeDeps.include` — pre-bundles `@enonic/ui` so aliases apply and CJS deps (`focus-trap-react`) convert to ESM

Use `include`, not `exclude` in `optimizeDeps` — `exclude` breaks `focus-trap-react` named exports.

Do NOT replace `@import "tailwindcss"` with granular layer imports in `storybook.css`.

## Story File Structure

```typescript
import { Component } from './component';
import type { Meta, StoryObj } from '@storybook/preact-vite';
import { useState } from 'react';
// Icons last
import { Icon1, Icon2 } from 'lucide-react';

type Story = StoryObj<typeof Component>;

export default {
  title: 'Components/Component',
  component: Component,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

// 1. Examples group
export const Basic: Story = { ... };
export const WithVariant: Story = { ... };

// 2. Features group
export const Interactive: Story = { ... };

// 3. Behavior group
export const FocusNavigation: Story = { ... };
export const DisabledItems: Story = { ... };

// 4. Specialized groups (if applicable)
export const RadioBasic: Story = { ... };
```
