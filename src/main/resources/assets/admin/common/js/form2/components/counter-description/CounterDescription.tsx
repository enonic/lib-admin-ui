import type {ReactElement} from 'react';
import {useI18n} from '../../I18nContext';

type CounterDescriptionProps = {
    length: number;
    maxLength: number;
    showCounter: boolean;
};

const COUNTER_DESCRIPTION_NAME = 'CounterDescription';

export const CounterDescription = ({length, maxLength, showCounter}: CounterDescriptionProps): ReactElement | null => {
    const t = useI18n();
    const hasMaxLength = maxLength > 0;
    if (showCounter && hasMaxLength) {
        const remaining = maxLength - length;
        return <>{`${t('field.value.chars.total', length)} / ${t('field.value.chars.left.short', remaining)}`}</>;
    }
    if (hasMaxLength) return <>{t('field.value.chars.left.long', maxLength - length)}</>;
    if (showCounter) return <>{t('field.value.chars.total', length)}</>;
    return null;
};

CounterDescription.displayName = COUNTER_DESCRIPTION_NAME;
