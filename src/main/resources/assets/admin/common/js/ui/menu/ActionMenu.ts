import {DivEl} from '../../dom/DivEl';
import {UlEl} from '../../dom/UlEl';
import {StyleHelper} from '../../StyleHelper';
import {Body} from '../../dom/Body';
import {Action} from '../Action';
import {MenuItem} from './MenuItem';

export class ActionMenu
    extends DivEl {

    private readonly actionListEl: UlEl;

    private readonly labelEl: DivEl;

    private expandedListeners: ((expanded: boolean) => void)[] = [];

    constructor(label: string, ...actions: Action[]) {
        super('menu action-menu');
        this.labelEl = new DivEl('drop-down-button icon-arrow_drop_down ' +
                                 StyleHelper.getCls('dropdown-handle', StyleHelper.COMMON_PREFIX));
        this.labelEl.setHtml(label);
        this.appendChild(this.labelEl);

        this.actionListEl = new UlEl();
        this.appendChild(this.actionListEl);

        if (actions.length > 0) {
            actions.forEach((action: Action) => {
                this.addAction(action);
            });
        }

        this.labelEl.onClicked(() => {
            this.toggleClass('down');
            this.labelEl.toggleClass('down');
            const isExpanded = this.hasClass('down');
            this.notifyExpanded(isExpanded);
        });

        Body.get().onClicked((event: MouseEvent) => this.foldMenuOnOutsideClick(event));
    }

    setLabel(label: string): void {
        this.labelEl.getEl().setInnerHtml(label);
    }

    addAction(action: Action): MenuItem {
        const actionMenuItem = new MenuItem(action);
        actionMenuItem.onClicked(() => {
            this.removeClass('down');
            this.labelEl.removeClass('down');
            this.notifyExpanded(false);
        });

        this.actionListEl.appendChild(actionMenuItem);

        return actionMenuItem;
    }

    onExpanded(listener: (expanded: boolean) => void): void {
        this.expandedListeners.push(listener);
    }

    unExpanded(listener: (expanded: boolean) => void): void {
        this.expandedListeners.filter((currentListener: (expanded: boolean) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyExpanded(expanded: boolean): void {
        this.expandedListeners.forEach((listener: (expanded: boolean) => void) => {
            listener(expanded);
        });
    }

    private foldMenuOnOutsideClick(evt: Event): void {
        if (!this.getEl().contains(evt.target as HTMLElement)) {
            // click outside menu
            this.removeClass('down');
            this.labelEl.removeClass('down');
            this.notifyExpanded(false);
        }
    }
}
