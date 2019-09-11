import {TabMenuButton} from '../../ui/tab/TabMenuButton';
import {SpanEl} from '../../dom/SpanEl';

export class AppBarTabMenuButton
    extends TabMenuButton {

    private tabCountEl: AppBarTabCount;

    constructor() {
        super();

        this.tabCountEl = new AppBarTabCount();
        this.prependChild(this.tabCountEl);
    }

    setTabCount(value: number) {
        this.tabCountEl.setCount(value);
    }

    setEditing(editing: boolean) {
        if (editing && !this.hasClass('editing')) {
            this.addClass('editing');
        } else if (!editing && this.hasClass('editing')) {
            this.removeClass('editing');
        }
    }
}

export class AppBarTabCount
    extends SpanEl {

    constructor() {
        super('tab-count');
    }

    setCount(value: number) {
        this.getEl().setInnerHtml(value > 0 ? '' + value : '');
    }
}
