export const WCAG = Symbol('WCAG');

export interface WCAG {
    [WCAG]?: boolean;
    tabbable?: boolean;
    role?: AriaRole | '';
    ariaLabel?: string;
    ariaHasPopup?: AriaHasPopup | '';
    ariaExpanded?: boolean;
    ariaHidden?: boolean;
}

export enum AriaRole {
    NONE = 'presentation',
    BANNER = 'banner',
    BUTTON = 'button',
    TOOLBAR = 'toolbar',
    MENU = 'menu',
    COMBOBOX = 'combobox',
    LISTBOX = 'listbox',
    OPTION = 'option'
}

export enum AriaHasPopup {
    TRUE = 'true',
    MENU = 'menu',
    LISTBOX = 'listbox',
    TREE = 'tree',
    GRID = 'grid',
    DIALOG = 'dialog'
}
