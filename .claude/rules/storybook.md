# Storybook Stories Standards

## Story Organization & Grouping

Use hierarchical grouping with `/` separator to organize stories:

```typescript
// ✅ DO: Group stories by purpose using slash separator
export const Basic: Story = {
  name: 'Examples / Basic',
  render: () => <Component />
};

export const WithIcons: Story = {
  name: 'Examples / With Icons',
  render: () => <Component icon={Icon} />
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
export const WithIconsExample: Story = { name: 'With Icons Example' };
```

### Standard Groups

Use these standard groups in order:

1. **Examples** - Basic usage patterns for newcomers
2. **States** - Visual states of the component
3. **Features** - Specific capabilities and configurations
4. **Behavior** - Interaction patterns and accessibility
5. **Radio/Checkbox/Select** - Specialized component variants

```typescript
// Story order from simple → complex:

// 1. EXAMPLES - Basic usage (newcomers start here)
export const Basic: Story = { name: 'Examples / Basic' };
export const WithSections: Story = { name: 'Examples / With Sections' };

// 2. STATES - Visual states of the component
export const Disabled: Story = { name: 'States / Disabled' };
export const ReadOnly: Story = { name: 'States / Read-Only' };

// 3. FEATURES - Specific capabilities
export const AlignEnd: Story = { name: 'Features / Align End' };
export const Interactive: Story = { name: 'Features / Interactive' };

// 4. BEHAVIOR - Interaction & accessibility
export const FocusNavigation: Story = { name: 'Behavior / Focus Navigation' };
export const DisabledItems: Story = { name: 'Behavior / Disabled Items' };

// 5. SPECIALIZED - Complete feature sets
export const RadioBasic: Story = { name: 'Radio / Basic' };
export const RadioMultipleGroups: Story = { name: 'Radio / Multiple Groups' };
```

## Interactive Playground

Create an "Interactive" story for components with meaningful configurable props:

```typescript
// ✅ DO: Add interactive story for components with multiple props
export const Interactive: Story = {
  name: 'Features / Interactive',
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [variant, setVariant] = useState<'solid' | 'outline'>('solid');
    const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');

    return (
      <div className='flex flex-col gap-y-4 p-4'>
        <div className='flex gap-4 text-sm'>
          <label>
            Variant:
            <select value={variant} onChange={(e) => setVariant(e.target.value)}>
              <option value='solid'>Solid</option>
              <option value='outline'>Outline</option>
            </select>
          </label>
          <label>
            Size:
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value='sm'>Small</option>
              <option value='md'>Medium</option>
              <option value='lg'>Large</option>
            </select>
          </label>
        </div>
        <Component variant={variant} size={size} />
      </div>
    );
  },
};

// ❌ DON'T: Skip interactive story for components with rich prop APIs
// ❌ DON'T: Create interactive story for components with single boolean prop
```

## Story Wrapper Styling

Use consistent wrapper patterns for story layout:

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

### Common Wrapper Patterns

```typescript
// Centered single component
<div className='flex flex-col gap-y-3 p-4 items-center'>
  <Component />
</div>

// Multiple components in a row
<div className='flex gap-4 p-4'>
  <Component />
  <Component />
</div>

// Grid layout for multiple variants
<div className='flex gap-6 flex-wrap justify-center p-4'>
  <Component variant='primary' />
  <Component variant='secondary' />
</div>

// With description
<div className='flex flex-col gap-y-3 p-4 items-center'>
  <div className='max-w-120 text-sm text-subtle'>
    Description text here
  </div>
  <Component />
</div>
```

## Story Descriptions

```typescript
// ✅ DO: Add descriptions for complex interactions or behaviors
<div className='max-w-120 text-sm text-subtle'>
  Test keyboard navigation: Tab should close menu and focus back to trigger button
</div>

// ✅ DO: Explain non-obvious features or usage
<div className='max-w-120 text-sm text-subtle'>
  Menu.Trigger without <code>asChild</code> renders a fallback button element
</div>

// ❌ DON'T: State obvious things
<div className='text-sm text-subtle'>This is a button</div>

// ❌ DON'T: Write essay-length descriptions
```

## Story Naming Conventions

```typescript
// ✅ DO: Use PascalCase for export names
export const BasicExample: Story = { name: 'Examples / Basic' };
export const WithDisabledItems: Story = { name: 'Behavior / Disabled Items' };

// ✅ DO: Use descriptive, clear names
export const AlignEnd: Story = { name: 'Features / Align End' };
export const NoLoop: Story = { name: 'Features / No Loop' };

// ❌ DON'T: Use redundant name property when export matches
export const Basic: Story = { name: 'Basic' }; // Just omit 'name'

// ❌ DON'T: Use unclear abbreviations
export const BtnVarPri: Story = { name: 'Btn Var Pri' };
```

## State Management in Stories

```typescript
// ✅ DO: Use local state for interactive stories
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <Input value={value} onChange={setValue} />;
  },
};

// ✅ DO: Show initial state clearly
const [isOpen, setIsOpen] = useState(false);
const [variant, setVariant] = useState<'solid' | 'outline'>('solid');

// ✅ DO: Display current state when useful
<div className='text-sm'>
  <span className='text-subtle'>Selected: </span>
  <span className='font-semibold'>{value}</span>
</div>

// ❌ DON'T: Use complex state management (Zustand, nanostores) in stories
```

## Accessibility Testing Hints

```typescript
// ✅ DO: Add helpful hints for keyboard testing
<div className='max-w-120 text-sm text-subtle'>
  Test keyboard navigation: Use ArrowLeft/Right, Home, and End keys
</div>

// ✅ DO: Indicate disabled state testing
<div className='max-w-120 text-sm text-subtle'>
  Disabled items are skipped during keyboard navigation but remain accessible to screen readers
</div>

// ✅ DO: Show focus management behavior
<div className='max-w-120 text-sm text-subtle'>
  Tab should move focus out of the component to the next focusable element
</div>
```

## Story File Structure

```typescript
import { Component } from './component';
import type { Meta, StoryObj } from '@storybook/preact-vite';
import { useState } from 'preact/hooks';
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
export const CustomStyled: Story = { ... };

// 3. Behavior group
export const FocusNavigation: Story = { ... };
export const DisabledItems: Story = { ... };

// 4. Specialized groups (if applicable)
export const RadioBasic: Story = { ... };
```
