import {Button} from './Button';
import {KeyBindings} from '../KeyBindings';
import {Action} from '../Action';
import {Tooltip} from '../Tooltip';
import {BrowserHelper} from '../../BrowserHelper';
import {KeyBindingAction} from '../KeyBinding';
import {IWCAG} from '../WCAG';
import {KeyHelper} from '../KeyHelper';
import {Body} from '../../dom/Body';

export class ActionButton
    extends Button {

    private action: Action;

    private tooltip: Tooltip;

    private iconClass: string;

    constructor(action: Action, wcag?: IWCAG) {
        super();

        this.addClass('action-button');
        this.initListeners();

        this.setAction(action);
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

    protected initListeners() {
        const executeAction = () => {
            Body.get().setFocusedElement(this);
            this.getAction().execute();
        };

        this.onClicked(() => executeAction());
        this.onEnterPressed(() => executeAction());

        this.onHelpKeyPressed = this.onHelpKeyPressed.bind(this);
        this.syncButtonWithAction = this.syncButtonWithAction.bind(this);

        KeyBindings.get().onHelpKeyPressed(this.onHelpKeyPressed);
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

    private syncButtonWithAction() {
        const action = this.getAction();

        const toggledEnabled = this.isEnabled() !== action.isEnabled();
        const toggledVisible = this.isVisible() !== action.isVisible();
        const becameHidden = toggledVisible && !action.isVisible();
        const tooltip = this.getTooltip();
        if (tooltip && (toggledEnabled || becameHidden)) {
            tooltip.hide();
        }
        toggledEnabled && this.setEnabled(action.isEnabled());
        toggledVisible && this.setVisible(action.isVisible());
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

    private doSetAction(action: Action) {
        action.onPropertyChanged(this.syncButtonWithAction);

        this.action = action;

        this.syncButtonWithAction();
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

}
