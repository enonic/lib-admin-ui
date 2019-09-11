import {DivEl} from '../../dom/DivEl';
import {UlEl} from '../../dom/UlEl';
import {StyleHelper} from '../../StyleHelper';
import {Body} from '../../dom/Body';
import {ActionMenuItem} from './ActionMenuItem';
import {Action} from '../Action';

export class ActionMenu
    extends DivEl {

    private actionListEl: UlEl;

    private labelEl: DivEl;

    constructor(label: string, ...actions: Action[]) {
        super('action-menu');
        this.labelEl = new DivEl('drop-down-button ' +
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
        });

        Body.get().onClicked((event: MouseEvent) => this.foldMenuOnOutsideClick(event));
    }

    setLabel(label: string) {
        this.labelEl.getEl().setInnerHtml(label);
    }

    addAction(action: Action) {
        let actionMenuItem = new ActionMenuItem(action);
        this.actionListEl.appendChild(actionMenuItem);
        actionMenuItem.onClicked(() => {
            this.removeClass('down');
            this.labelEl.removeClass('down');
        });
    }

    private foldMenuOnOutsideClick(evt: Event): void {
        if (!this.getEl().contains(<HTMLElement> evt.target)) {
            // click outside menu
            this.removeClass('down');
            this.labelEl.removeClass('down');
        }
    }
}
