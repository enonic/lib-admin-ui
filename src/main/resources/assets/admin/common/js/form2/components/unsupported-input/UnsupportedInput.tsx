import type {ReactElement} from 'react';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponentProps} from '../../types';

const UNSUPPORTED_INPUT_NAME = 'UnsupportedInput';

export const UnsupportedInput = ({input}: InputTypeComponentProps): ReactElement => {
    const t = useI18n();
    const typeName = input.getInputType().getName();
    return (
        <div
            data-component={UNSUPPORTED_INPUT_NAME}
            className='flex min-h-12 cursor-default items-center justify-center rounded border border-bdr-subtle border-dashed px-4.5 py-3 text-subtle text-xs'
        >
            {t('field.value.unsupportedType', typeName)}
        </div>
    );
};

UnsupportedInput.displayName = UNSUPPORTED_INPUT_NAME;
