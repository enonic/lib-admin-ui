import type {MouseEvent as ReactMouseEvent} from 'react';
import type {SpanEl} from '../dom/SpanEl';
import {LegacyElement} from '../ui2/LegacyElement';
import {
    Notification,
    type NotificationAction,
    type NotificationProps,
    type NotificationTone,
} from '../ui2/Notification';
import {type Message, type MessageAction, MessageType} from './Message';

export class NotificationMessage extends LegacyElement<typeof Notification, NotificationProps> {
    private readonly message: Message;

    constructor(message: Message, onOpenChange?: (open: boolean) => void) {
        super(
            {
                tone: getToastTone(message.getType()),
                text: message.getText(),
                open: true,
                withClose: true,
                onOpenChange,
                actions: message.getActions().map(buildToastAction),
            },
            Notification,
        );

        this.message = message;
    }

    setOpen(open: boolean): void {
        this.props.setKey('open', open);
    }

    close(): void {
        this.setOpen(false);
    }

    getMessage(): Message {
        return this.message;
    }

    isAutoHide(): boolean {
        return this.message.getAutoHide();
    }

    setText(text: string): void {
        this.props.setKey('text', text);
    }

    addAction(action: MessageAction): void {
        const {actions} = this.props.get();
        this.props.setKey('actions', [...actions, buildToastAction(action)]);
    }

    getRemoveEl(): SpanEl | null {
        return null;
    }
}

function getToastTone(type: MessageType): NotificationTone {
    switch (type) {
        case MessageType.SUCCESS:
        case MessageType.ACTION:
            return 'success';
        case MessageType.ERROR:
            return 'error';
        case MessageType.WARNING:
            return 'warning';
        default:
            return 'info';
    }
}

function buildToastAction(action: MessageAction): NotificationAction {
    return {
        label: action.getName(),
        onClick: (event: ReactMouseEvent<HTMLButtonElement>) => action.getHandler()?.(event),
    };
}
