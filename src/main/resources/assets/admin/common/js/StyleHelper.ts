export class StyleHelper {

    static COMMON_PREFIX: string = 'xp-admin-common-';

    static ADMIN_PREFIX: string = 'xp-admin-';

    static ICON_PREFIX: string = 'icon-';

    static currentPrefix: string = '';

    static setCurrentPrefix(prefix: string) {
        StyleHelper.currentPrefix = prefix;
    }

    static getCurrentPrefix(): string {
        return StyleHelper.currentPrefix;
    }

    static getCls(cls: string, prefix: string = StyleHelper.currentPrefix): string {
        if (!prefix) {
            return cls;
        }
        let clsArr = cls.trim().split(' ');
        clsArr.forEach((clsEl: string, index: number, arr: string[]) => {
            if (!StyleHelper.isPrefixed(clsEl, prefix)) {
                arr[index] = prefix + clsEl;
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
