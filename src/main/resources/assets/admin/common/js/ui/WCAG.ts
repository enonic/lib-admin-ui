export const IWCAG = Symbol('IWCAG');

export interface IWCAG {
    [IWCAG]: boolean;
    tabbable?: boolean;
    role?: AriaRole;
    ariaLabel?: string;
    ariaHasPopup?: AriaHasPopup;
}

export enum AriaRole {
    NONE = 'presentation',
    BANNER = 'banner',
    BUTTON = 'button',
    TOOLBAR = 'toolbar',
    MENU = 'menu',
}

export enum AriaHasPopup {
    TRUE = 'true',
    MENU = 'menu',
    LISTBOX = 'listbox',
    TREE = 'tree',
    GRID = 'grid',
    DIALOG = 'dialog'
}
