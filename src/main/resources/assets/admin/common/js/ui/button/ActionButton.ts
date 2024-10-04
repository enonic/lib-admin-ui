import {BrowserHelper} from '../../BrowserHelper';
import {Body} from '../../dom/Body';
import {Action} from '../Action';
import {KeyBindingAction} from '../KeyBinding';
import {KeyBindings} from '../KeyBindings';
import {Tooltip} from '../Tooltip';
import {WCAG} from '../WCAG';
import {Button} from './Button';

export class ActionButton
    extends Button {

    private action: Action;

    private tooltip: Tooltip;

    private iconClass: string;

    constructor(action: Action, wcag?: WCAG) {
        super();

        this.addClass('action-button');
        this.initListeners();

        this.setAction(action);
    }

    protected initListeners() {
        const executeAction = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            Body.get().setFocusedElement(this);
            this.getAction().execute();
        };

        this.onClicked(executeAction);

        this.onHelpKeyPressed = this.onHelpKeyPressed.bind(this);
        this.syncButtonWithAction = this.syncButtonWithAction.bind(this);

        KeyBindings.get().onHelpKeyPressed(this.onHelpKeyPressed);
    }

    getAction(): Action {
        return this.action;
    }

    setAction(action: Action) {
        if (this.action === action) {
            return;
        }

        if (this.action) {
            if (this.action.hasClass()) {
                this.removeClass(this.action.getClass());
            }
            this.action.unPropertyChanged(this.syncButtonWithAction);
            if (!action.hasShortcut()) {
                KeyBindings.get().unHelpKeyPressed(this.onHelpKeyPressed);
            }
        }
        this.doSetAction(action);
    }

    getTooltip(): Tooltip {
        return this.tooltip;
    }

    protected createLabel(action: Action): string {
        let label: string;
        if (action.hasMnemonic()) {
            label = action.getMnemonic().underlineMnemonic(action.getLabel());
        } else {
            label = action.getLabel();
        }
        return label;
    }

    private syncButtonWithAction() {
        const action = this.getAction();

        const toggledEnabled = this.isEnabled() !== action.isEnabled();
        const toggledVisible = this.isVisible() !== action.isVisible();
        const becameHidden = toggledVisible && !action.isVisible();
        const tooltip = this.getTooltip();
        if (tooltip && (toggledEnabled || becameHidden)) {
            tooltip.hide();
        }
        if (toggledEnabled) {
            this.setEnabled(action.isEnabled());
        }
        if (toggledVisible) {
            this.setVisible(action.isVisible());
        }
        this.setLabel(this.createLabel(action), false);
        this.updateIconClass(action.getIconClass());

        const actionClass = action.getClass();
        if (actionClass && !this.hasClass(actionClass)) {
            this.addClass(actionClass);
        }

        if (action.hasWcagAttributes()) {
            this.applyWCAGAttributes(action.getWcagAttributes());
        }
    }

    private createTooltip() {
        if (!this.action.hasShortcut()) {
            return;
        }

        let combination = this.action.getShortcut().getCombination();
        if (combination) {
            combination = combination.replace(/mod\+/i, BrowserHelper.isOSX() || BrowserHelper.isIOS() ? 'cmd+' : 'ctrl+');
        }
        this.tooltip = new Tooltip(this, combination, 1000);
    }

    private doSetAction(action: Action) {
        action.onPropertyChanged(this.syncButtonWithAction);

        this.action = action;

        this.createTooltip();
        this.whenRendered(this.syncButtonWithAction);
    }

    private onHelpKeyPressed(e: KeyboardEvent) {
        const action = this.getAction();
        if (!action.hasShortcut()) {
            return;
        }
        const tooltip = this.getTooltip();
        if (action.isEnabled() && KeyBindings.get().isActive(action.getShortcut())) {
            if (KeyBindingAction[KeyBindingAction.KEYDOWN].toLowerCase() === e.type) {
                tooltip.show();
                return;
            }
        }
        tooltip.hide();
    }

    private updateIconClass(newIconClass: string) {
        if (newIconClass === this.iconClass) {
            return;
        }
        if (this.iconClass) {
            this.removeClass(this.iconClass);
        }
        this.iconClass = newIconClass;
        if (this.iconClass) {
            this.addClass(this.iconClass);
        }
    }
}
