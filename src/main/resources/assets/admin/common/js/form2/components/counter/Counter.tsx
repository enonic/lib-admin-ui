import {cn, Tooltip} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useI18n} from '../../I18nContext';

type CounterProps = {
    length: number;
    maxLength: number;
    bottom?: boolean;
};

const COUNTER_NAME = 'Counter';

export const Counter = ({length, maxLength, bottom}: CounterProps): ReactElement => {
    const t = useI18n();

    const remaining = maxLength - length;
    const exceeded = length - maxLength;
    const isOverLimit = remaining < 0;
    const toolTipPosition = bottom ? 'bottom' : 'top';

    const toolTipText = isOverLimit
        ? `${t('field.value.breaks.tooLong', exceeded)}`
        : `${t('field.value.chars.left.long', remaining)}`;

    const tooltipValue = maxLength ? toolTipText : undefined;

    const counterValue = maxLength ? (
        <span>
            <span className={cn(isOverLimit && 'text-error')}>{length}</span>/{maxLength}
        </span>
    ) : (
        <span>{length}</span>
    );

    return (
        <Tooltip value={tooltipValue} side={toolTipPosition} delay={300}>
            <span data-component={COUNTER_NAME} className='cursor-default text-sm text-subtle'>
                {counterValue}
            </span>
        </Tooltip>
    );
};

Counter.displayName = COUNTER_NAME;
