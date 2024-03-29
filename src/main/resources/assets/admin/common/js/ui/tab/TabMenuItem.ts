import {TabItem, TabItemBuilder} from './TabItem';

export class TabMenuItem
    extends TabItem {

    private visibleInMenu: boolean = true;

    constructor(builder: TabMenuItemBuilder) {
        super(builder.setCloseButtonEnabled(true), 'tab-menu-item');
    }

    static create(): TabMenuItemBuilder {
        return new TabMenuItemBuilder();
    }

    isVisibleInMenu(): boolean {
        return this.visibleInMenu;
    }

    setVisibleInMenu(value: boolean) {
        this.visibleInMenu = value;
        super.setVisible(value);
    }

}

export class TabMenuItemBuilder
    extends TabItemBuilder {

    build(): TabMenuItem {
        return new TabMenuItem(this);
    }

    setLabel(label: string): TabMenuItemBuilder {
        return super.setLabel(label) as TabMenuItemBuilder;
    }

    setAddLabelTitleAttribute(addLabelTitleAttribute: boolean): TabMenuItemBuilder {
        return super.setAddLabelTitleAttribute(addLabelTitleAttribute) as TabMenuItemBuilder;
    }

}
