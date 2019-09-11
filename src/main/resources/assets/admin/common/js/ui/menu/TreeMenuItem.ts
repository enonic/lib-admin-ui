import {DdDtEl} from '../../dom/DdDtEl';
import {Action} from '../Action';

export class TreeMenuItem
    extends DdDtEl {
    private action: Action;

    constructor(action: Action, cls: string = '', expanded: boolean = false) {
        super(action.hasParentAction() ? 'dd' : 'dt');

        this.action = action;
        cls = this.getCls(action, cls, expanded);
        if (cls) {
            this.setClass(cls);
        }
        this.getEl().setInnerHtml(action.getLabel());
        this.onClicked(() => {
            if (action.isEnabled()) {
                if (action.hasChildActions()) {
                    this.toggleExpand();
                } else {
                    action.execute();
                }
            }
        });
        this.setEnabled(action.isEnabled());
        this.setVisible(action.isVisible());

        action.onPropertyChanged((changedAction: Action) => {
            this.setEnabled(changedAction.isEnabled());
            this.setVisible(changedAction.isVisible());
        });
    }

    public toggleExpand() {
        this.toggleClass('expanded');
    }

    getAction(): Action {
        return this.action;
    }

    setVisible(value: boolean) {
        this.toggleClass('expanded', value);
        return this;
    }

    setEnabled(value: boolean) {
        this.getEl()
            .setDisabled(!value)
            .toggleClass('disabled', !value);
    }

    private getCls(action: Action, cls: string = '', expanded: boolean = false): string {
        let fullCls = action.hasChildActions() ? 'collapsible ' : '';
        fullCls += expanded ? 'expanded ' : '';

        return fullCls + cls;
    }
}
