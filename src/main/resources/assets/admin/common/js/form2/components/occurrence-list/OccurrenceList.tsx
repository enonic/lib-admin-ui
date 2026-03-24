import {Button, cn, IconButton} from '@enonic/ui';
import {Plus, X} from 'lucide-react';
import {type ReactElement, type ReactNode, useCallback} from 'react';
import type {Value} from '../../../data/Value';
import type {Input} from '../../../form/Input';
import type {InputTypeConfig} from '../../descriptor/InputTypeConfig';
import type {OccurrenceManagerState} from '../../descriptor/OccurrenceManager';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponent} from '../../types';
import {getOccurrenceErrorMessage} from '../../utils/validation';
import {FieldError} from '../field-error';
import {InputLabel} from '../input-label';
import {SortableList} from '../sortable-list';

//
// * Types
//

export type OccurrenceListRootProps<C extends InputTypeConfig = InputTypeConfig> = {
    Component: InputTypeComponent<C>;
    state: OccurrenceManagerState;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onMove: (fromIndex: number, toIndex: number) => void;
    onChange: (index: number, value: Value, rawValue?: string) => void;
    onBlur?: (index: number) => void;
    config: C;
    input: Input;
    enabled: boolean;
};

type OccurrenceListItemContentProps<C extends InputTypeConfig = InputTypeConfig> = {
    Component: InputTypeComponent<C>;
    value: Value;
    index: number;
    config: C;
    input: Input;
    enabled: boolean;
    errors: OccurrenceManagerState['occurrenceValidation'][number];
    showRemove: boolean;
    onChange: (index: number, value: Value, rawValue?: string) => void;
    onBlur?: (index: number) => void;
    onRemove: (index: number) => void;
};

type OccurrenceListItemProps<C extends InputTypeConfig = InputTypeConfig> = OccurrenceListItemContentProps<C> & {
    className?: string;
};

//
// * OccurrenceListItemContent
//

const OccurrenceListItemContent = <C extends InputTypeConfig = InputTypeConfig>({
    Component,
    value,
    index,
    config,
    input,
    enabled,
    errors,
    showRemove,
    onChange,
    onBlur,
    onRemove,
}: OccurrenceListItemContentProps<C>): ReactNode => {
    const t = useI18n();

    return (
        <>
            <div className='min-w-0 flex-1'>
                <Component
                    value={value}
                    onChange={(v: Value, raw?: string) => onChange(index, v, raw)}
                    onBlur={onBlur ? () => onBlur(index) : undefined}
                    config={config}
                    input={input}
                    enabled={enabled}
                    index={index}
                    errors={errors.validationResults}
                />
            </div>
            {showRemove && (
                <IconButton
                    icon={X}
                    iconSize='lg'
                    variant='text'
                    className='size-8'
                    disabled={!enabled}
                    aria-label={t('field.occurrence.action.remove')}
                    onClick={() => onRemove(index)}
                />
            )}
        </>
    );
};

//
// * OccurrenceListItem
//

const OccurrenceListItem = <C extends InputTypeConfig = InputTypeConfig>({
    className,
    ...props
}: OccurrenceListItemProps<C>): ReactElement => (
    <div className={cn('flex items-center gap-2', props.showRemove && 'pr-2', className)}>
        <OccurrenceListItemContent {...props} />
    </div>
);

//
// * OccurrenceListRoot
//

const OCCURRENCE_LIST_NAME = 'OccurrenceList';

const OccurrenceListRoot = <C extends InputTypeConfig = InputTypeConfig>({
    Component,
    state,
    onAdd,
    onRemove,
    onMove,
    onChange,
    onBlur,
    config,
    input,
    enabled,
}: OccurrenceListRootProps<C>): ReactElement => {
    const t = useI18n();
    const occurrences = input.getOccurrences();
    const min = occurrences.getMinimum();
    const max = occurrences.getMaximum();
    // Non-multiple: max=1, regardless of min. Both min=1,max=1 (required) and min=0,max=1 (optional)
    // render a single bare input with no add/remove buttons — matching legacy InputView behavior.
    const isSingle = !occurrences.multiple();
    // Fixed: exact count like 3:3 — no add/remove, no drag. Excludes single (1:1) which early-returns.
    const isFixed = min > 0 && min === max && !isSingle;
    const isDraggable = occurrences.multiple() && !isFixed;
    const keyExtractor = useCallback((_: Value, i: number) => state.ids[i], [state.ids]);

    // Single mode: render component bare
    // ? Minimum occurrences are eagerly populated in useOccurrenceManager, so values[0] is always present
    if (isSingle) {
        const value = state.values[0];
        const errors = state.occurrenceValidation[0];
        if (value == null || errors == null) return <div data-component={OCCURRENCE_LIST_NAME} />;

        const occurrenceError = getOccurrenceErrorMessage(occurrences, state.occurrenceValidation, t);
        // Occurrence error is mutually exclusive with field errors (getOccurrenceErrorMessage
        // returns undefined when field errors exist), so it's safe to merge into the same array.
        // This lets components render it via their built-in error display (e.g. Input.error).
        const allErrors =
            occurrenceError != null
                ? [...errors.validationResults, {message: occurrenceError}]
                : errors.validationResults;

        return (
            <div data-component={OCCURRENCE_LIST_NAME} className='grid gap-y-2'>
                <InputLabel input={input} />
                <Component
                    value={value}
                    onChange={(v: Value, raw?: string) => onChange(0, v, raw)}
                    onBlur={onBlur ? () => onBlur(0) : undefined}
                    config={config}
                    input={input}
                    enabled={enabled}
                    index={0}
                    errors={allErrors}
                />
            </div>
        );
    }

    const contentProps = (index: number): OccurrenceListItemContentProps<C> => ({
        Component,
        value: state.values[index],
        index,
        config,
        input,
        enabled,
        errors: state.occurrenceValidation[index],
        // canRemove reflects the schema minimum; the count > 1 guard is a UX policy
        // matching legacy isRemoveButtonRequiredStrict() — never remove the last visible input.
        showRemove: state.canRemove && state.values.length > 1 && !isFixed,
        onChange,
        onBlur,
        onRemove,
    });

    const addButton = state.canAdd && !isFixed && (
        <Button
            variant='outline'
            size='sm'
            iconSize={16}
            iconStrokeWidth={1.75}
            endIcon={Plus}
            label={t('action.add')}
            className='ml-auto w-fit'
            onClick={onAdd}
            disabled={!enabled}
        />
    );

    const occurrenceError = getOccurrenceErrorMessage(occurrences, state.occurrenceValidation, t);

    if (isDraggable) {
        const showRemove = state.canRemove && state.values.length > 1;

        return (
            <div data-component={OCCURRENCE_LIST_NAME} className='grid gap-y-2'>
                <InputLabel input={input} />
                <SortableList
                    items={state.values}
                    keyExtractor={keyExtractor}
                    onMove={onMove}
                    enabled={enabled}
                    dragLabel={t('field.occurrence.action.reorder')}
                    className='flex flex-col gap-y-2.5'
                    itemClassName={({isMovable}) => cn('-my-1 gap-2 py-1', isMovable && 'pl-2', showRemove && 'pr-2')}
                    renderItem={({index}) => <OccurrenceListItemContent {...contentProps(index)} />}
                />
                {(occurrenceError != null || addButton) && (
                    <div className='flex items-start gap-x-2'>
                        <FieldError className='flex-1' message={occurrenceError} />
                        {addButton}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div data-component={OCCURRENCE_LIST_NAME} className='grid gap-y-2'>
            <InputLabel input={input} />
            <div className='flex flex-col gap-y-2.5'>
                {state.values.map((_, i) => (
                    <OccurrenceListItem key={state.ids[i]} {...contentProps(i)} />
                ))}
            </div>
            {(occurrenceError != null || addButton) && (
                <div className='flex items-start gap-x-2'>
                    <FieldError className='flex-1' message={occurrenceError} />
                    {addButton}
                </div>
            )}
        </div>
    );
};

OccurrenceListRoot.displayName = OCCURRENCE_LIST_NAME;

export const OccurrenceList = Object.assign(OccurrenceListRoot, {
    Root: OccurrenceListRoot,
});
