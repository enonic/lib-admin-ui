import {Toast, type ToastProps, type ToastTone} from '@enonic/ui';
import type {ReactElement, MouseEvent as ReactMouseEvent} from 'react';

export type NotificationTone = ToastTone;

export type NotificationAction = {
    label: string;
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

export type NotificationProps = ToastProps & {
    text: string;
    tone: NotificationTone;
    actions: NotificationAction[];
};

const NOTIFICATION_NAME = 'Notification';

export const Notification = ({
    text,
    tone = 'info',
    actions = [],
    children,
    ...props
}: NotificationProps): ReactElement => {
    return (
        <Toast data-component={NOTIFICATION_NAME} {...props}>
            <Toast.Icon tone={tone} />
            <Toast.Description>{text}</Toast.Description>
            {children}
            {actions.map(({label, onClick}) => (
                <Toast.Button key={label} label={label} onClick={onClick} />
            ))}
        </Toast>
    );
};

Notification.displayName = NOTIFICATION_NAME;
