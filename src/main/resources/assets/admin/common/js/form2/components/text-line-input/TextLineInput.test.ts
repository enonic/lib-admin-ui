import type {JSX} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {Occurrences} from '../../../form/Occurrences';
import type {ValidationResult} from '../../descriptor';
import {getFirstError} from '../../utils';
import {TextLineInput, type TextLineInputProps} from './TextLineInput';

const mocks = vi.hoisted(() => ({
    useState: vi.fn((initial: unknown) => [
        typeof initial === 'function' ? (initial as () => unknown)() : initial,
        vi.fn(),
    ]),
    useEffect: vi.fn(),
    useRef: vi.fn((initial: unknown) => ({current: initial})),
    useContext: vi.fn(() => undefined),
    input: vi.fn(() => null),
}));

vi.mock('react', async importOriginal => {
    const actual = await importOriginal<typeof import('react')>();

    return {
        ...actual,
        useState: mocks.useState,
        useEffect: mocks.useEffect,
        useRef: mocks.useRef,
        useContext: mocks.useContext,
    };
});

vi.mock('@enonic/ui', () => ({
    Input: mocks.input,
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
    useBlinkAttention: () => false,
}));

function makeInput() {
    return new InputBuilder()
        .setName('textLine')
        .setInputType(new InputTypeName('TextLine', false))
        .setLabel('Text line')
        .setOccurrences(Occurrences.max(1))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeProps(overrides: Partial<TextLineInputProps> = {}): TextLineInputProps {
    return {
        value: ValueTypes.STRING.newNullValue(),
        onChange: vi.fn(),
        onBlur: vi.fn(),
        config: {regexp: undefined, maxLength: -1, showCounter: false},
        input: makeInput(),
        enabled: true,
        index: 0,
        errors: [],
        ...overrides,
    };
}

type VNode = {type: unknown; props: Record<string, any>};

describe('getFirstError', () => {
    it('should return undefined for empty array', () => {
        // Arrange & Act
        const result = getFirstError([]);

        expect(result).toBeUndefined();
    });

    it('should return first message for single error', () => {
        const errors: ValidationResult[] = [{message: 'Too long'}];

        const result = getFirstError(errors);

        expect(result).toBe('Too long');
    });

    it('should return first message for multiple errors', () => {
        const errors: ValidationResult[] = [{message: 'First error'}, {message: 'Second error'}];

        const result = getFirstError(errors);

        expect(result).toBe('First error');
    });
});

describe('TextLineInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useState.mockImplementation((initial: unknown) => [
            typeof initial === 'function' ? (initial as () => unknown)() : initial,
            vi.fn(),
        ]);
        mocks.useEffect.mockImplementation(() => undefined);
        mocks.useRef.mockImplementation((initial: unknown) => ({current: initial}));
        mocks.useContext.mockImplementation(() => undefined);
    });

    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.STRING.newNullValue();

            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(true);
            expect(stringValue).toBe('');
        });

        it('should produce string display for valid string value', () => {
            const value = ValueTypes.STRING.newValue('hello');

            const stringValue = value.isNull() ? '' : (value.getString() ?? '');

            expect(value.isNull()).toBe(false);
            expect(stringValue).toBe('hello');
        });

        it('should produce correct Value type on onChange', () => {
            // Arrange & Act
            const newValue = ValueTypes.STRING.newValue('test input');

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getString()).toBe('test input');
            expect(newValue.getType()).toBe(ValueTypes.STRING);
        });

        it('forwards parsed Value and rawValue through onChange', () => {
            const onChange = vi.fn();

            const element = TextLineInput(makeProps({onChange})) as VNode;

            element.props.onChange({currentTarget: {value: 'abc'}} as JSX.TargetedEvent<HTMLInputElement>);

            expect(onChange).toHaveBeenCalledOnce();
            expect((onChange.mock.calls[0][0] as Value).getString()).toBe('abc');
            expect(onChange.mock.calls[0][1]).toBe('abc');
        });

        it('prefers rawValue over value for display', () => {
            const element = TextLineInput(
                makeProps({value: ValueTypes.STRING.newNullValue(), rawValue: 'typed-but-invalid'}),
            ) as VNode;

            expect(element.props.value).toBe('typed-but-invalid');
        });
    });

    describe('locale attributes', () => {
        it('defaults to spellCheck only when no locale is provided', () => {
            const element = TextLineInput(makeProps()) as VNode;

            expect(element.props.spellCheck).toBe(true);
            expect(element.props.lang).toBeUndefined();
            expect(element.props.dir).toBeUndefined();
        });

        it('emits lang for a non-RTL locale', () => {
            mocks.useContext.mockReturnValue('nb-NO');

            const element = TextLineInput(makeProps()) as VNode;

            expect(element.props.lang).toBe('nb');
            expect(element.props.spellCheck).toBe(true);
            expect(element.props.dir).toBeUndefined();
        });

        it('emits lang and dir=rtl for an RTL locale', () => {
            mocks.useContext.mockReturnValue('ar-SA');

            const element = TextLineInput(makeProps()) as VNode;

            expect(element.props.lang).toBe('ar');
            expect(element.props.dir).toBe('rtl');
            expect(element.props.spellCheck).toBe(true);
        });
    });
});
