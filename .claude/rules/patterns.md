# UI Patterns

## Click Target Expansion via Pseudo-Element

Extend clickable area to fill gaps between list items using `::after` pseudo-element.

**Pattern:** `'after:inset-x-0 after:-inset-y-{n} after:-z-10 after:pointer-events-auto after:absolute after:rounded-sm after:content-[""]'`

**Formula:** `-inset-y-{n}` where `n = gap / 2`

| Container Gap | Item Inset |
|---------------|------------|
| `gap-y-1` | `after:-inset-y-0.5` |
| `gap-y-1.5` | `after:-inset-y-0.75` |
| `gap-y-2` | `after:-inset-y-1` |

### When NOT to Use

- **Virtualized lists**: Absolute positioning clips overflow
- **Adjacent items with no gaps**: Pattern not needed (e.g., Menu items)
- **Horizontal expansion**: Never use `-inset-x-*` (causes overflow)

### Current Usage

| Component | Container Gap | Item Pattern |
|-----------|---------------|--------------|
| TreeList.Row | `gap-y-1.5` | `after:-inset-y-0.75` |
| TreeListContent.Row | `gap-y-1` | `after:-inset-y-0.5` |
| Listbox Item | `gap-y-1` | `after:-inset-y-0.5` |
| Selector Item | `gap-y-1` | `after:-inset-y-0.5` |
| Checkbox (unlabeled) | N/A | `after:-inset-1` (standalone touch target) |
| Menu Items | No gap | Pattern removed |

## Focus Ring on Inverse Backgrounds

When a focusable element appears on an inverse/selected background (e.g., inside a menu item with `data-tone="inverse"`), the focus ring colors must be overridden to match the background.

**Pattern:** Override CSS custom properties on the parent with `group-data-[tone=inverse]`:

```tsx
'group-data-[tone=inverse]:[--color-ring-offset:var(--color-surface-selected)]'
'group-data-[tone=inverse]:[--color-ring:var(--color-ring-alt)]'
```

**Why:** The focus ring has a 3px offset (`ring-offset-3`) that creates a visible gap. This gap must match the background color, otherwise it appears as a jarring light stripe on dark backgrounds.

| Variable | Purpose | Inverse Value |
|----------|---------|---------------|
| `--color-ring-offset` | Gap between element and ring | `var(--color-surface-selected)` |
| `--color-ring` | The focus ring itself | `var(--color-ring-alt)` |

### Current Usage

| Component | Context |
|-----------|---------|
| Button | Inside tree list rows with `data-tone="inverse"` |
| Checkbox | Inside menu items with `data-tone="inverse"` |

## Focus Trap with Portaled Content

When using components with portals (e.g., `Combobox.Portal`) inside a `Dialog`, the focus trap must be extended to include the portaled content. Otherwise, focus cannot move to elements rendered outside the dialog DOM.

### Problem

- `Dialog.Content` uses `focus-trap-react` to lock focus within the dialog
- Portaled content (e.g., `Combobox.Popup`) renders in `document.body`
- Focus trap blocks focus from moving to the portaled popup

### Solution

Use `usePortalFocusContainer` hook — a registration system where portaled components register themselves with the parent focus trap.

**How it works:**
1. `Dialog.Content` creates a `FocusContainerRegistry` and provides it via `FocusContainerContext`
2. Portaled popup components call `usePortalFocusContainer` to register with the registry
3. `Dialog.Content` passes all registered containers to `FocusTrap` via `containerElements` prop

### Implementation Checklist

When adding new components that use portals inside dialogs:

1. **Import the hook** from its location in the codebase

2. **Detect portal mode and register:**
   ```tsx
   const contentRef = useRef<HTMLDivElement>(null);
   const [isPortalMode, setIsPortalMode] = useState(false);

   useLayoutEffect(() => {
     if (!open || !contentRef.current) return;
     setIsPortalMode(contentRef.current.parentElement === document.body);
   }, [open]);

   usePortalFocusContainer(contentRef, isPortalMode);
   ```

### Current Usage (reference from @enonic/ui)

| Component | Content Element | Registers With Focus Trap |
|-----------|-----------------|---------------------------|
| `Combobox.Popup` | Popup container | ✅ Yes |
| `Menu.Content` | Menu dropdown | ✅ Yes |
| `ContextMenu.Content` | Context menu | ✅ Yes |
| `DatePicker.Content` | Calendar popup | ✅ Yes |
| `Selector.Content` | Dropdown list | ✅ Yes |
| `Menubar.Content` | Menu dropdown | ✅ Yes |
| `Dialog.Content` | Dialog itself | Has own trap (provider) |
| `Tooltip.Content` | Tooltip popup | No (non-interactive) |
