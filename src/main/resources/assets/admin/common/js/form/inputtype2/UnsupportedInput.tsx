import {useI18n} from './I18nContext';
import type {InputTypeComponentProps} from './types';

export function UnsupportedInput({input}: InputTypeComponentProps) {
    const t = useI18n();
    const typeName = input.getInputType().getName();
    return (
        <div class='flex min-h-12 cursor-default items-center justify-center rounded border border-bdr-subtle border-dashed px-4.5 py-3 text-subtle text-xs'>
            {t('field.value.unsupportedType', typeName)}
        </div>
    );
}
