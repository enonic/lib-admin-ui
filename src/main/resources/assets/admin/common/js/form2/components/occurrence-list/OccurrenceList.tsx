import {Button, cn, IconButton} from '@enonic/ui';
import {Plus, X} from 'lucide-react';
import {type ReactElement, type ReactNode, useCallback} from 'react';
import type {Value} from '../../../data/Value';
import type {Input} from '../../../form/Input';
import type {InputTypeConfig, OccurrenceManagerState} from '../../descriptor';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponent} from '../../types';
import {getFirstError, getOccurrenceErrorMessage} from '../../utils';
import {FieldError} from '../field-error';
import {InputLabel} from '../input-label';
import {SortableGridList} from '../sortable-grid-list';

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
    onFocus?: () => void;
    config: C;
    input: Input;
    enabled: boolean;
    /**
     * Occurrence IDs currently held in a processing lock by an external caller (e.g.
     * an in-flight AI translation). Items whose ID is in the set render their inner
     * Component with `processing={true}`, which propagates the readOnly + busy
     * affordance through TextLine/TextArea inputs.
     */
    processingOccurrenceIds?: ReadonlySet<string>;
    /**
     * Resolves the `inputRef` callback for an occurrence ID. InputField supplies this so
     * each rendered occurrence reports its focusable DOM element back into the field's
     * ref map — backing reveal/focus/blur-on-acquire for list-mode input types.
     */
    getInputRef?: (occurrenceId: string) => (el: HTMLElement | null) => void;
    /**
     * Attention-blink trigger for a single occurrence. The matching occurrence receives
     * `count` as its `highlight` prop; every other occurrence receives `undefined`.
     */
    highlight?: {occurrenceId: string; count: number};
};

type OccurrenceListItemContentProps<C extends InputTypeConfig = InputTypeConfig> = {
    Component: InputTypeComponent<C>;
    value: Value;
    rawValue?: string;
    index: number;
    config: C;
    input: Input;
    enabled: boolean;
    errors: OccurrenceManagerState['occurrenceValidation'][number];
    showRemove: boolean;
    processing: boolean;
    inputRef?: (el: HTMLElement | null) => void;
    highlight?: number;
    className?: string;
    onChange: (index: number, value: Value, rawValue?: string) => void;
    onBlur?: (index: number) => void;
    onFocus?: () => void;
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
    rawValue,
    index,
    config,
    input,
    enabled,
    errors,
    showRemove,
    processing,
    inputRef,
    highlight,
    className,
    onChange,
    onBlur,
    onFocus,
    onRemove,
}: OccurrenceListItemContentProps<C>): ReactNode => {
    const t = useI18n();

    return (
        <>
            <div className={cn('min-w-0 flex-1', className)}>
                <Component
                    value={value}
                    rawValue={rawValue}
                    onChange={(v: Value, raw?: string) => onChange(index, v, raw)}
                    onBlur={onBlur ? () => onBlur(index) : undefined}
                    onFocus={onFocus}
                    config={config}
                    input={input}
                    enabled={enabled}
                    index={index}
                    errors={errors.validationResults}
                    processing={processing}
                    inputRef={inputRef}
                    highlight={highlight}
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
    onFocus,
    config,
    input,
    enabled,
    processingOccurrenceIds,
    getInputRef,
    highlight,
}: OccurrenceListRootProps<C>): ReactElement => {
    const isProcessing = (index: number): boolean => processingOccurrenceIds?.has(state.ids[index]) ?? false;
    const occurrenceInputRef = (index: number): ((el: HTMLElement | null) => void) | undefined => {
        const occurrenceId = state.ids[index];
        return occurrenceId != null ? getInputRef?.(occurrenceId) : undefined;
    };
    const occurrenceHighlight = (index: number): number | undefined => {
        const occurrenceId = state.ids[index];
        return highlight != null && highlight.occurrenceId === occurrenceId ? highlight.count : undefined;
    };
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
                    rawValue={state.rawValues[0]}
                    onChange={(v: Value, raw?: string) => onChange(0, v, raw)}
                    onBlur={onBlur ? () => onBlur(0) : undefined}
                    onFocus={onFocus}
                    config={config}
                    input={input}
                    enabled={enabled}
                    index={0}
                    errors={allErrors}
                    processing={isProcessing(0)}
                    inputRef={occurrenceInputRef(0)}
                    highlight={occurrenceHighlight(0)}
                />
            </div>
        );
    }

    const contentProps = (index: number): OccurrenceListItemContentProps<C> => ({
        Component,
        value: state.values[index],
        rawValue: state.rawValues[index],
        index,
        config,
        input,
        enabled,
        errors: state.occurrenceValidation[index],
        // canRemove reflects the schema minimum; the count > 1 guard is a UX policy
        // matching legacy isRemoveButtonRequiredStrict() — never remove the last visible input.
        showRemove: state.canRemove && state.values.length > 1 && !isFixed,
        processing: isProcessing(index),
        inputRef: occurrenceInputRef(index),
        highlight: occurrenceHighlight(index),
        onChange,
        onBlur,
        onFocus,
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
                <SortableGridList
                    items={state.values}
                    keyExtractor={keyExtractor}
                    onMove={onMove}
                    enabled={enabled}
                    dragLabel={t('field.occurrence.action.reorder')}
                    className='flex flex-col gap-y-2.5'
                    itemClassName={({isMovable}) =>
                        cn(
                            '-my-1 grid gap-2 py-1',
                            isMovable ? 'grid-cols-[auto_minmax(0,1fr)_auto] pl-2' : 'grid-cols-[minmax(0,1fr)_auto]',
                            showRemove && 'pr-2',
                        )
                    }
                    renderItem={({index, isMovable}) => {
                        const props = contentProps(index);
                        const fieldError = !props.processing
                            ? getFirstError(props.errors.validationResults)
                            : undefined;

                        return (
                            <>
                                <OccurrenceListItemContent
                                    {...props}
                                    errors={{...props.errors, validationResults: []}}
                                    className={cn(
                                        isMovable ? 'col-start-2' : 'col-start-1',
                                        !showRemove && 'col-span-2',
                                    )}
                                />
                                <FieldError
                                    className={cn(
                                        'min-w-0',
                                        isMovable ? 'col-span-2 col-start-2' : 'col-span-2 col-start-1',
                                    )}
                                    message={fieldError}
                                />
                            </>
                        );
                    }}
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
