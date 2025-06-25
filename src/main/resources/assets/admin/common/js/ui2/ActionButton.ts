import * as UI from '@enonic/ui';

import {BrowserHelper} from '../BrowserHelper';
import {Action} from '../ui/Action';
import {LegacyElement} from './LegacyElement';

export interface ActionButtonProps {
    action: Action;
    className?: string;
}

export type ActionProps = Pick<UI.ButtonProps, 'className' |'label' | 'title' | 'disabled' >;

export class ActionButton extends LegacyElement<typeof UI.Button> {

    private actionProps: ActionButtonProps;

    constructor(props: ActionButtonProps) {
        super({
            onClick: () => {
                this.giveFocus();
                this.actionProps.action.execute();

            },
            ...createPropsFromAction(props),
        }, UI.Button);

        this.actionProps = props;

        this.actionProps.action.onPropertyChanged(this.updateProps);
    }

    private updateProps = () => {
        this.setProps(createPropsFromAction(this.actionProps));
    }

    // * Backward compatibility methods

    getAction(): Action {
        return this.actionProps.action;
    }

    setAction(action: Action): void {
        if (this.actionProps.action === action) return;

        this.actionProps.action?.unPropertyChanged(this.updateProps);

        this.actionProps.action = action;
        this.updateProps();
    }
}

//
// Utils
//

function createPropsFromAction({action, className}: ActionButtonProps): ActionProps {
    return {
        className: UI.cn('action-button', action.getClass(), action.getIconClass(), className),
        label: createLabel(action),
        title: createTooltipText(action),
        disabled: !action.isEnabled(),
    };
}

function createLabel(action: Action): string {
    const label = action.getLabel();
    return action.getMnemonic()?.underlineMnemonic(label) ?? label;
}

function createTooltipText(action: Action): string {
    const titleOrLabel = action.getTitle() || action.getLabel();
    if (!action.hasShortcut()) {
        return titleOrLabel;
    }

    const combination = formatShortcut(action.getShortcut().getCombination());
    return `${titleOrLabel} (${combination})`;
}

function formatShortcut(combination: string): string {
    const isApple = BrowserHelper.isOSX() || BrowserHelper.isIOS();
    return combination?.replace(/mod\+/i, isApple ? 'cmd+' : 'ctrl+') ?? '';
}
