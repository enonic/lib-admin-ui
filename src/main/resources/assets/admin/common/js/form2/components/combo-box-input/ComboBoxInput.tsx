import {Combobox, cn, IconButton, Listbox} from '@enonic/ui';
import {X} from 'lucide-react';
import type {ReactElement} from 'react';
import {useCallback, useMemo, useState} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {ComboBoxConfig} from '../../descriptor/InputTypeConfig';
import {useI18n} from '../../I18nContext';
import type {SelfManagedComponentProps} from '../../types';
import {getFirstError, getOccurrenceErrorMessage} from '../../utils';
import {FieldError} from '../field-error';
import {SortableList} from '../sortable-list';

//
// * ComboBoxInput
//

const COMBO_BOX_INPUT_NAME = 'ComboBoxInput';

export const ComboBoxInput = ({
    values,
    onAdd,
    onRemove,
    onMove,
    occurrences,
    config,
    enabled,
    errors,
}: SelfManagedComponentProps<ComboBoxConfig>): ReactElement => {
    const t = useI18n();
    const [searchValue, setSearchValue] = useState<string | undefined>();

    const selectedStrings = useMemo(() => values.filter(v => !v.isNull()).map(v => v.getString()), [values]);
    const selectedSet = useMemo(() => new Set(selectedStrings), [selectedStrings]);
    const optionMap = useMemo(() => new Map(config.options.map(o => [o.value, o])), [config.options]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return config.options;
        const query = searchValue.toLowerCase();
        return config.options.filter(
            o => o.label.toLowerCase().includes(query) || o.value.toLowerCase().includes(query),
        );
    }, [config.options, searchValue]);

    const isMultiSelect = occurrences.getMaximum() === 0 || occurrences.getMaximum() > 1;
    const canAdd = occurrences.getMaximum() === 0 || values.length < occurrences.getMaximum();
    // ? Occurrence errors are rendered by InputField — only field errors shown here
    const occurrenceError = getOccurrenceErrorMessage(occurrences, errors, t);
    const firstFieldError = errors.map(entry => getFirstError(entry.validationResults)).find(Boolean);
    const hasErrors = occurrenceError != null || firstFieldError != null;

    const handleSelectionChange = useCallback(
        (newSelection: readonly string[]) => {
            const newSet = new Set(newSelection);

            // ? Reverse order keeps indices stable during batch removal
            for (let i = values.length - 1; i >= 0; i--) {
                const str = values[i].isNull() ? undefined : values[i].getString();
                if (str != null && !newSet.has(str)) {
                    onRemove(i);
                }
            }

            for (const val of newSelection) {
                if (!selectedSet.has(val)) {
                    onAdd(ValueTypes.STRING.newValue(val));
                }
            }

            setSearchValue(undefined);
        },
        [selectedSet, values, onAdd, onRemove],
    );

    // ? Stable reference for SortableList — used in its internal useMemo for IDs
    const keyExtractor = useCallback(
        (item: Value, index: number) => (item.isNull() ? `null-${index}` : item.getString()),
        [],
    );

    return (
        <div data-component={COMBO_BOX_INPUT_NAME} className='flex flex-col gap-y-2'>
            {canAdd && (
                <Combobox.Root
                    value={searchValue}
                    onChange={setSearchValue}
                    selection={selectedStrings}
                    onSelectionChange={handleSelectionChange}
                    selectionMode={isMultiSelect ? 'staged' : 'multiple'}
                    disabled={!enabled}
                    error={hasErrors}
                >
                    <Combobox.Content className='relative'>
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
                                <Combobox.Input placeholder='Type to search...' />
                                {isMultiSelect && <Combobox.Apply />}
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>
                        <Combobox.Popup>
                            <Listbox.Content className='rounded-sm'>
                                {filteredOptions.map(option => (
                                    <Listbox.Item key={option.value} value={option.value}>
                                        {option.label}
                                    </Listbox.Item>
                                ))}
                            </Listbox.Content>
                        </Combobox.Popup>
                    </Combobox.Content>
                </Combobox.Root>
            )}

            {values.length > 0 && (
                <SortableList
                    items={values}
                    keyExtractor={keyExtractor}
                    onMove={onMove}
                    enabled={enabled}
                    dragLabel={t('field.occurrence.action.reorder')}
                    className={cn('flex flex-col gap-y-2.5', canAdd && 'mt-3')}
                    itemClassName='gap-2.5 px-2.5 py-1'
                    renderItem={({item, index}) => {
                        const str = item.isNull() ? '' : item.getString();
                        const itemError = getFirstError(errors[index]?.validationResults ?? []);
                        return (
                            <>
                                <div className='min-w-0 flex-1'>
                                    <span className={cn('block truncate text-sm', itemError && 'text-error')}>
                                        {optionMap.get(str)?.label ?? str}
                                    </span>
                                </div>
                                <IconButton
                                    icon={X}
                                    iconSize='lg'
                                    variant='text'
                                    className='size-8'
                                    disabled={!enabled}
                                    aria-label={t('field.occurrence.action.remove')}
                                    onClick={() => onRemove(index)}
                                />
                            </>
                        );
                    }}
                />
            )}

            <FieldError message={firstFieldError} />
        </div>
    );
};

ComboBoxInput.displayName = COMBO_BOX_INPUT_NAME;
