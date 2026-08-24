import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../data/ValueTypes';
import {InputBuilder} from '../../form/Input';
import {InputTypeName} from '../../form/InputTypeName';
import {Occurrences} from '../../form/Occurrences';
import type {InputTypeComponentProps} from '../types';
import {DateInput} from './date-input';
import {DateTimeInput} from './date-time-input';
import {InstantInput} from './instant-input';
import {TimeInput} from './time-input';

const mocks = vi.hoisted(() => {
    const component = () => () => null;
    const DatePicker = Object.assign(component(), {
        Root: component(),
        Trigger: component(),
        Portal: component(),
        Content: component(),
        Header: component(),
        Weekdays: component(),
        Grid: component(),
    });
    const TimePicker = Object.assign(component(), {
        Trigger: component(),
        Content: component(),
        HourSelect: component(),
        MinuteSelect: component(),
    });

    return {
        Button: component(),
        DatePicker,
        Input: component(),
        TimePicker,
        useIsMobile: vi.fn(() => false),
        useState: vi.fn(),
        useRef: vi.fn(),
    };
});

vi.mock('react', async importOriginal => {
    const actual = await importOriginal<typeof import('react')>();

    return {
        ...actual,
        useCallback: (callback: unknown) => callback,
        useMemo: (factory: () => unknown) => factory(),
        useRef: mocks.useRef,
        useState: mocks.useState,
    };
});

vi.mock('@enonic/ui', () => ({
    Button: mocks.Button,
    DatePicker: mocks.DatePicker,
    Input: mocks.Input,
    TimePicker: mocks.TimePicker,
}));

vi.mock('../hooks/useIsMobile', () => ({
    useIsMobile: mocks.useIsMobile,
}));

vi.mock('../I18nContext', () => ({
    useI18n: () => (key: string) => key,
}));

type VNode = {
    type: unknown;
    ref?: ((element: HTMLElement | null) => void) | {current: HTMLElement | null};
    props: Record<string, unknown> & {children?: unknown; onClick?: () => void; type?: string; value?: unknown};
};

function findElement(node: unknown, type: unknown): VNode | undefined {
    if (Array.isArray(node)) {
        return node.map(child => findElement(child, type)).find(Boolean);
    }

    if (node == null || typeof node !== 'object' || !('type' in node) || !('props' in node)) {
        return undefined;
    }

    const element = node as VNode;
    return element.type === type ? element : findElement(element.props.children, type);
}

function makeInput(name: string) {
    return new InputBuilder()
        .setName(name)
        .setInputType(new InputTypeName(name, false))
        .setLabel(name)
        .setOccurrences(Occurrences.max(1))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeProps(
    name: string,
    value: InputTypeComponentProps['value'],
    overrides: Partial<InputTypeComponentProps> = {},
): InputTypeComponentProps {
    return {
        value,
        onChange: vi.fn(),
        config: {default: undefined},
        input: makeInput(name),
        enabled: true,
        index: 0,
        errors: [],
        ...overrides,
    };
}

describe('mobile input behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useIsMobile.mockReturnValue(false);
        mocks.useState.mockImplementation((initial: unknown) => [initial, vi.fn()]);
        mocks.useRef.mockImplementation((initial: unknown) => ({current: initial}));
    });

    it.each([
        ['Time', TimeInput, ValueTypes.LOCAL_TIME.newNullValue(), '09:15'],
        ['Instant', InstantInput, ValueTypes.DATE_TIME.newNullValue(), '09:15'],
    ])('%s picker confirmation completes mobile navigation', (name, Component, value, draftTime) => {
        const inputElement = {focus: vi.fn()} as unknown as HTMLInputElement;
        const onMobileComplete = vi.fn();
        const draftDate = new Date(2025, 0, 1);
        const stateValues = name === 'Instant' ? [false, draftDate, draftTime] : [false, draftTime];
        stateValues.forEach(stateValue => {
            mocks.useState.mockImplementationOnce(() => [stateValue, vi.fn()]);
        });
        mocks.useRef.mockImplementationOnce(() => ({current: inputElement}));

        const tree = Component(makeProps(name, value, {onMobileComplete}) as never);
        if (name === 'Instant') {
            expect((tree as VNode).props.native).toBe(false);
        }
        findElement(tree, mocks.Button)?.props.onClick?.();

        expect(onMobileComplete).toHaveBeenCalledWith(inputElement);
        expect(inputElement.focus).not.toHaveBeenCalled();
    });

    it.each([
        ['Date', DateInput, ValueTypes.LOCAL_DATE.newValue('2025-01-02'), 'date', '2025-01-02'],
        [
            'DateTime',
            DateTimeInput,
            ValueTypes.LOCAL_DATE_TIME.newValue('2025-01-02T09:15'),
            'datetime-local',
            '2025-01-02T09:15',
        ],
    ])('%s renders its native control on mobile', (name, Component, value, type, expectedValue) => {
        const externalInputRef = vi.fn();
        const onMobileComplete = vi.fn();
        const inputElement = {} as HTMLInputElement;
        mocks.useIsMobile.mockReturnValue(true);

        const tree = Component(makeProps(name, value, {inputRef: externalInputRef, onMobileComplete}) as never);
        const input = findElement(tree, mocks.Input);
        if (typeof input?.ref === 'function') {
            input.ref(inputElement);
        }

        expect(input?.props.type).toBe(type);
        expect(input?.props.value).toBe(expectedValue);
        expect(input?.props['data-mobile-focus-target']).toBe(true);
        expect(input?.props.enterKeyHint).toBe('next');
        expect(externalInputRef).toHaveBeenCalledWith(inputElement);

        const currentTarget = {} as HTMLInputElement;
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        if (input == null) throw new Error('Expected native input');
        (input.props.onKeyDown as (event: unknown) => void)({
            key: 'Enter',
            currentTarget,
            preventDefault,
            stopPropagation,
        });

        expect(onMobileComplete).toHaveBeenCalledWith(currentTarget);
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
    });
});
