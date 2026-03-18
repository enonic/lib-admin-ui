import {Button, type ButtonProps, cn} from '@enonic/ui';
import type {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';

import type {Input} from '../../../form/Input';

//
// * InputLabelAction
//

const INPUT_LABEL_ACTION_NAME = 'InputLabelAction';

export type InputLabelActionProps = Omit<ButtonProps, 'size'>;

const InputLabelAction = ({className, ...props}: InputLabelActionProps): ReactElement => {
    return (
        <Button
            data-component={INPUT_LABEL_ACTION_NAME}
            {...props}
            variant='text'
            size='sm'
            className={cn('-my-0.75 h-6 px-1.5 focus-visible:ring-offset-0', className)}
        />
    );
};

InputLabelAction.displayName = INPUT_LABEL_ACTION_NAME;

//
// * InputLabelRoot
//

const INPUT_LABEL_NAME = 'InputLabel';

export type InputLabelRootProps = {
    input: Input;
    children?: ReactNode;
} & ComponentPropsWithoutRef<'div'>;

const InputLabelRoot = ({input, children, className, ...props}: InputLabelRootProps): ReactElement | null => {
    const label = input.getLabel();
    const description = input.getHelpText();

    if (!label && !description) return null;

    const hasChildren = children != null;
    const required = input.getOccurrences().required();

    return (
        <div
            data-component={INPUT_LABEL_NAME}
            className={cn(hasChildren && 'grid grid-cols-[1fr_auto] items-baseline gap-x-2', className)}
            {...props}
        >
            {label && (
                <div className={cn('font-semibold text-base text-main', hasChildren && description && 'col-span-full')}>
                    {label}
                    {required && ' *'}
                </div>
            )}
            {description && <div className='text-sm text-subtle'>{description}</div>}
            {children}
        </div>
    );
};

InputLabelRoot.displayName = INPUT_LABEL_NAME;

export const InputLabel = Object.assign(InputLabelRoot, {
    Root: InputLabelRoot,
    Action: InputLabelAction,
});
