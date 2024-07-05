export const IWCAG = Symbol('IWCAG');

export interface IWCAG {
    [IWCAG]: boolean;
    ariaLabel?: string;
    role?: AriaRole;
    tabbable?: boolean;
}

export enum AriaRole {
    NONE = 'presentation',
    BANNER = 'banner',
    BUTTON = 'button',
    TOOLBAR = 'toolbar'
}
