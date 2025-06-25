import * as UI from '@enonic/ui';
import {unwrap} from '@enonic/ui';
import {render} from 'react-dom';
import {BrowserHelper} from '../BrowserHelper';
import {Action} from '../ui/Action';
import {LegacyElement} from './LegacyElement';

export type ActionButtonProps<T extends Action> = {
    action: T;
    className?: string;
    startIcon?: UI.LucideIcon;
    endIcon?: UI.LucideIcon;
} & Omit<UI.ButtonProps, 'label' | 'title' | 'disabled'>;

export type ActionProps = Pick<UI.ButtonProps, 'className' |'label' | 'title' | 'disabled' >;

export class ActionButton<T extends Action = Action> extends LegacyElement<typeof UI.Button> {

    private actionProps: ActionButtonProps<T>;

    constructor(props: ActionButtonProps<T>) {
        super({
            onClick: () => {
                this.giveFocus();
                this.actionProps.action.execute();
            },
            startIcon: props.startIcon,
            endIcon: props.endIcon,
            ...createPropsFromAction(props),
        }, UI.Button);

        this.actionProps = props;

        this.actionProps.action.onPropertyChanged(this.updateProps);
    }

    private updateProps = () => {
        this.setProps(createPropsFromAction(this.actionProps));
    }

    // * Backward compatibility methods

    getAction(): T {
        return this.actionProps.action;
    }

    setAction(action: T): void {
        if (this.actionProps.action === action) return;

        this.actionProps.action?.unPropertyChanged(this.updateProps);

        this.actionProps.action = action;
        this.updateProps();
    }

    setEnabled(enabled: boolean): void {
        this.actionProps.action.setEnabled(enabled);
    }

    protected override renderJsx(): void {
        const ActionButtonComponent = this.component;
        const props = this.props.get();

        render(
            <UI.IdProvider prefix={this.getPrefix()}>
                <UI.Tooltip value={unwrap(props.title)}>
                    <ActionButtonComponent {...props} />
                </UI.Tooltip>
            </UI.IdProvider>,
            this.getHTMLElement()
        );
    }
}

//
// Utils
//

function createPropsFromAction<T extends Action>({action, className}: ActionButtonProps<T>): ActionProps {
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
