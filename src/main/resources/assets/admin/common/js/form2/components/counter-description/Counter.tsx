import {cn, Tooltip} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useI18n} from '../../I18nContext';

type CounterProps = {
    length: number;
    maxLength: number;
    showCounter: boolean;
    bottom?: boolean;
};

const COUNTER_NAME = 'Counter';

export const Counter = ({length, maxLength, showCounter, bottom}: CounterProps): ReactElement => {
    const t = useI18n();

    const remaining = maxLength - length;
    const isOverLimit = remaining < 0;
    const toolTipPosition = bottom ? 'bottom' : 'top';

    const tooltipValue = isOverLimit
        ? `${length - maxLength} characters over limit ${t('field.value.chars.total', length)}`
        : `${t('field.value.chars.left.long', remaining)}`;

    const counterValue = showCounter ? (isOverLimit ? `${remaining}` : `${length}/${maxLength}`) : `${remaining}`;

    return (
        <Tooltip value={tooltipValue} side={toolTipPosition} delay={300}>
            <span className={cn('cursor-default text-sm text-subtle', isOverLimit && 'text-error')}>
                <span className='tabular-nums'>{counterValue}</span>
            </span>
        </Tooltip>
    );
};

Counter.displayName = COUNTER_NAME;
