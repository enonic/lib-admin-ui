import {cn, FilledOctagonAlert, IconButton} from '@enonic/ui';
import {X} from 'lucide-react';
import type {ReactNode} from 'react';

export type FieldErrorProps = {
    /** Error text to display. Renders nothing when `undefined`. */
    message?: string;
    /**
     * When provided, renders a dismiss control next to the message and invokes this
     * on click. Use for transient errors (e.g. translation failures) that the user
     * may want to acknowledge without editing the field.
     */
    onDismiss?: () => void;
    /** Accessible label for the dismiss control. Falls back to "Dismiss" when omitted. */
    dismissLabel?: string;
    className?: string;
};

const FIELD_ERROR_NAME = 'FieldError';

export const FieldError = ({message, onDismiss, dismissLabel, className}: FieldErrorProps): ReactNode => {
    if (message == null) return null;

    return (
        <div
            data-component={FIELD_ERROR_NAME}
            className={cn('flex items-center gap-2 text-error leading-5', className)}
        >
            <FilledOctagonAlert size={16} className='shrink-0' />
            <span className='flex-1'>{message}</span>
            {onDismiss != null && (
                <IconButton
                    icon={X}
                    iconSize='sm'
                    variant='text'
                    className='size-5 shrink-0'
                    aria-label={dismissLabel ?? 'Dismiss'}
                    onClick={onDismiss}
                />
            )}
        </div>
    );
};

FieldError.displayName = FIELD_ERROR_NAME;
