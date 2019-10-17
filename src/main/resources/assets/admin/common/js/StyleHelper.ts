import {Store} from './store/Store';

export class StyleHelper {

    static COMMON_PREFIX: string = 'xp-admin-common-';

    static ADMIN_PREFIX: string = 'xp-admin-';

    static ICON_PREFIX: string = 'icon-';

    static setCurrentPrefix(prefix: string) {
        Store.instance().set('prefix', prefix);
    }

    static getCls(cls: string, prefix?: string): string {
        const currentPrefix = prefix != null ? prefix : Store.instance().get('prefix');
        if (!currentPrefix) {
            return cls;
        }
        const clsArr = cls.trim().split(' ');
        clsArr.forEach((clsEl: string, index: number, arr: string[]) => {
            if (!StyleHelper.isPrefixed(clsEl, currentPrefix)) {
                arr[index] = currentPrefix + clsEl;
            }
        });
        return clsArr.join(' ');
    }

    static getIconCls(iconCls: string): string {
        return StyleHelper.getCls(StyleHelper.ICON_PREFIX + iconCls);
    }

    static getCommonIconCls(iconCls: string): string {
        return StyleHelper.getCls(StyleHelper.ICON_PREFIX + iconCls, StyleHelper.COMMON_PREFIX);
    }

    private static isPrefixed(cls: string, prefix: string): boolean {
        return cls.indexOf(prefix) === 0;
    }
}
