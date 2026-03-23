import {cn, FilledOctagonAlert} from '@enonic/ui';
import type {ReactNode} from 'react';

export type FieldErrorProps = {
    /** Error text to display. Renders nothing when `undefined`. */
    message?: string;
    className?: string;
};

const FIELD_ERROR_NAME = 'FieldError';

export const FieldError = ({message, className}: FieldErrorProps): ReactNode => {
    if (message == null) return null;

    return (
        <div
            data-component={FIELD_ERROR_NAME}
            className={cn('flex items-center gap-2 text-error leading-5', className)}
        >
            <FilledOctagonAlert size={16} className='shrink-0' />
            {message}
        </div>
    );
};

FieldError.displayName = FIELD_ERROR_NAME;
