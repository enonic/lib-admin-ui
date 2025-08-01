import * as UI from '@enonic/ui';

import {unwrap} from '@enonic/ui';
import {h, render} from 'preact';
import {BrowserHelper} from '../BrowserHelper';
import {Action} from '../ui/Action';
import {LegacyElement} from './LegacyElement';

export interface ActionIconProps {
    action: Action;
    icon: UI.LucideIcon;
    className?: string;
}

export type ActionProps = Pick<UI.ButtonProps, 'className' |'label' | 'title' | 'disabled' >;

export class ActionIcon extends LegacyElement<typeof UI.IconButton> {

    private actionProps: ActionIconProps;

    constructor(props: ActionIconProps) {
        super({
            onClick: () => {
                this.giveFocus();
                this.actionProps.action.execute();
            },
            icon: props.icon,
            ...createPropsFromAction(props),
        }, UI.IconButton);

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

    doRender(): Q.Promise<boolean> {
        const ActionIcon = h(this.component, this.props.get());
        const tooltip = h(UI.Tooltip, {
            value: unwrap(this.props.get().title),
            children: ActionIcon,
        } satisfies UI.TooltipProps);
        render(tooltip, this.getHTMLElement());
        return super.doRender();
    }

    setEnabled(enabled: boolean): void {
        this.actionProps.action.setEnabled(enabled);
    }
}

//
// Utils
//

function createPropsFromAction({action, className}: ActionIconProps): ActionProps {
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
