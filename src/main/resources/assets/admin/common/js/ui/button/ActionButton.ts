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

        this.action = action;
        this.setLabel(this.createLabel(action), false);
        this.addClass('action-button');
        if (action.getClass()) {
            this.addClass(action.getClass());
        }

        if (wcag) {
            wcag.role && this.setRole(wcag.role);
            wcag.ariaHasPopup && this.setAriaHasPopup(wcag.ariaHasPopup);
        }

        this.setEnabled(this.action.isEnabled());
        this.setVisible(this.action.isVisible());

        this.updateIconClass(this.action.getIconClass());

        if (this.action.hasShortcut()) {
            let combination = this.action.getShortcut().getCombination();
            if (combination) {
                combination = combination.replace(/mod\+/i, BrowserHelper.isOSX() || BrowserHelper.isIOS() ? 'cmd+' : 'ctrl+');
            }
            this.tooltip = new Tooltip(this, combination, 1000);
            KeyBindings.get().onHelpKeyPressed((e) => {
                if (this.action.isEnabled() && KeyBindings.get().isActive(this.action.getShortcut())) {
                    if (KeyBindingAction[KeyBindingAction.KEYDOWN].toLowerCase() === e.type) {
                        this.tooltip.show();
                        return;
                    }
                }
                this.tooltip.hide();
            });
        }

        this.onKeyDown((event: KeyboardEvent) => KeyHelper.isEnterKey(event) && this.action.execute());
        this.onClicked(() => this.action.execute());

        this.action.onExecuted(() => {
            Body.get().setFocusedElement(this);
        });

        this.action.onPropertyChanged((changedAction: Action) => {
            const toggledEnabled = this.isEnabled() !== changedAction.isEnabled();
            const toggledVisible = this.isVisible() !== changedAction.isVisible();
            const becameHidden = toggledVisible && !changedAction.isVisible();
            if (this.tooltip && (toggledEnabled || becameHidden)) {
                this.tooltip.hide();
            }
            toggledEnabled && this.setEnabled(changedAction.isEnabled());
            toggledVisible && this.setVisible(changedAction.isVisible());
            this.setLabel(this.createLabel(changedAction), false);
            this.updateIconClass(changedAction.getIconClass());
        });
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

}
