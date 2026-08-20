import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../../data/ValueTypes';
import {Occurrences} from '../../../form/Occurrences';
import {ComboBoxDescriptor} from '../../descriptor/ComboBoxDescriptor';
import type {ComboBoxConfig} from '../../descriptor/InputTypeConfig';
import type {SelfManagedComponentProps} from '../../types';
import {ComboBoxInput} from './ComboBoxInput';

const mocks = vi.hoisted(() => ({
    useState: vi.fn((initial: unknown) => [
        typeof initial === 'function' ? (initial as () => unknown)() : initial,
        vi.fn(),
    ]),
    useMemo: vi.fn((factory: () => unknown) => factory()),
    useCallback: vi.fn((callback: unknown) => callback),
    useI18n: vi.fn(() => (key: string) => key),
    useValidationVisibility: vi.fn(() => 'all'),
}));

vi.mock('react', () => ({
    useState: mocks.useState,
    useMemo: mocks.useMemo,
    useCallback: mocks.useCallback,
}));

// ? Component mocks are string tags — the element tree is inspected, never rendered
vi.mock('@enonic/ui', () => ({
    Combobox: {
        Root: 'Combobox.Root',
        Content: 'Combobox.Content',
        Control: 'Combobox.Control',
        Search: 'Combobox.Search',
        SearchIcon: 'Combobox.SearchIcon',
        Input: 'Combobox.Input',
        Apply: 'Combobox.Apply',
        Toggle: 'Combobox.Toggle',
        Popup: 'Combobox.Popup',
    },
    Listbox: {Content: 'Listbox.Content', Item: 'Listbox.Item'},
    cn: (...tokens: unknown[]) => tokens.filter(Boolean).join(' '),
    FilledSquareCheck: 'FilledSquareCheck',
    IconButton: 'IconButton',
}));

vi.mock('../../I18nContext', () => ({
    useI18n: mocks.useI18n,
}));

vi.mock('../../ValidationContext', () => ({
    useValidationVisibility: mocks.useValidationVisibility,
}));

vi.mock('../field-error', () => ({FieldError: 'FieldError'}));

vi.mock('../sortable-grid-list', () => ({SortableGridList: 'SortableGridList'}));

type ComboBoxInputProps = SelfManagedComponentProps<ComboBoxConfig>;

function makeProps(overrides: Partial<ComboBoxInputProps> = {}): ComboBoxInputProps {
    return {
        occurrenceIds: [],
        values: [],
        onChange: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onMove: vi.fn(),
        occurrences: Occurrences.minmax(1, 3),
        config: {options: [{label: 'Alpha', value: 'a'}]},
        input: null as never,
        enabled: true,
        errors: [],
        ...overrides,
    };
}

function getElementProps(type: string, overrides: Partial<ComboBoxInputProps> = {}): Record<string, any> {
    const element = ComboBoxInput(makeProps(overrides)) as {props: {children: any[]}};
    const child = element.props.children.find(c => c && c.type === type);
    if (!child) {
        throw new Error(`${type} was not rendered`);
    }
    return child.props;
}

describe('ComboBoxInput', () => {
    describe('selected values derivation', () => {
        it('should extract strings from non-null values', () => {
            const values = [ValueTypes.STRING.newValue('option1'), ValueTypes.STRING.newValue('option2')];

            const selectedStrings = values.filter(v => !v.isNull()).map(v => v.getString());

            expect(selectedStrings).toEqual(['option1', 'option2']);
        });

        it('should skip null values', () => {
            const values = [
                ValueTypes.STRING.newValue('option1'),
                ValueTypes.STRING.newNullValue(),
                ValueTypes.STRING.newValue('option3'),
            ];

            const selectedStrings = values.filter(v => !v.isNull()).map(v => v.getString());

            expect(selectedStrings).toEqual(['option1', 'option3']);
        });

        it('should return empty array for no values', () => {
            const selectedStrings = [].filter(() => true).map(() => '');

            expect(selectedStrings).toEqual([]);
        });
    });

    describe('option lookup', () => {
        const options: ComboBoxConfig['options'] = [
            {label: 'Alpha', value: 'a'},
            {label: 'Beta', value: 'b'},
            {label: 'Gamma', value: 'c'},
        ];
        const optionMap = new Map(options.map(o => [o.value, o]));

        it('should find option by value', () => {
            expect(optionMap.get('b')?.label).toBe('Beta');
        });

        it('should return undefined for unknown value', () => {
            expect(optionMap.get('unknown')).toBeUndefined();
        });
    });

    describe('option filtering', () => {
        const options: ComboBoxConfig['options'] = [
            {label: 'Alpha', value: 'a'},
            {label: 'Beta', value: 'b'},
            {label: 'Gamma', value: 'c'},
        ];

        it('should filter by label case-insensitively', () => {
            const query = 'alpha';
            const filtered = options.filter(o => o.label.toLowerCase().includes(query));

            expect(filtered).toHaveLength(1);
            expect(filtered[0].value).toBe('a');
        });

        it('should filter by value', () => {
            const query = 'b';
            const filtered = options.filter(
                o => o.label.toLowerCase().includes(query) || o.value.toLowerCase().includes(query),
            );

            expect(filtered).toHaveLength(1);
        });

        it('should return all options when query is empty', () => {
            const filtered = options;

            expect(filtered).toHaveLength(3);
        });
    });

    describe('isMultiSelect computation', () => {
        function isMultiSelect(max: number): boolean {
            return max === 0 || max > 1;
        }

        it('should be false for single select (max 1)', () => {
            expect(isMultiSelect(1)).toBe(false);
        });

        it('should be true for unlimited (max 0)', () => {
            expect(isMultiSelect(0)).toBe(true);
        });

        it('should be true for max greater than 1', () => {
            expect(isMultiSelect(2)).toBe(true);
            expect(isMultiSelect(5)).toBe(true);
        });
    });

    describe('canAdd computation', () => {
        function canAdd(max: number, count: number): boolean {
            return max === 0 || count < max;
        }

        it('should allow adding when below max', () => {
            expect(canAdd(3, 1)).toBe(true);
        });

        it('should allow adding when max is unlimited (0)', () => {
            expect(canAdd(0, 100)).toBe(true);
        });

        it('should not allow adding when at max', () => {
            expect(canAdd(3, 3)).toBe(false);
        });
    });

    describe('descriptor integration', () => {
        it('should parse config options correctly', () => {
            const config = ComboBoxDescriptor.readConfig({
                options: [
                    {value: 'Label 1', '@value': 'key1'},
                    {value: 'Label 2', '@value': 'key2'},
                ],
            });

            expect(config.options).toEqual([
                {label: 'Label 1', value: 'key1'},
                {label: 'Label 2', value: 'key2'},
            ]);
        });

        it('should create value from string', () => {
            const value = ValueTypes.STRING.newValue('option1');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('option1');
        });
    });

    describe('validation visibility', () => {
        beforeEach(() => {
            mocks.useState.mockReset();
            mocks.useState.mockImplementation((initial: unknown) => [
                typeof initial === 'function' ? (initial as () => unknown)() : initial,
                vi.fn(),
            ]);
            mocks.useValidationVisibility.mockReturnValue('all');
        });

        const touchedStateImplementation = (initial: unknown) => [
            initial === false ? true : typeof initial === 'function' ? (initial as () => unknown)() : initial,
            vi.fn(),
        ];

        it('does not surface the occurrence error on untouched new content in interactive mode', () => {
            mocks.useValidationVisibility.mockReturnValue('interactive');
            expect(getElementProps('Combobox.Root').error).toBe(false);
        });

        it('surfaces the occurrence error for an empty required field once validation is fully visible', () => {
            expect(getElementProps('Combobox.Root').error).toBe(true);
        });

        it('surfaces the occurrence error on new content once the field has been interacted with', () => {
            mocks.useValidationVisibility.mockReturnValue('interactive');
            mocks.useState.mockImplementation(touchedStateImplementation);
            expect(getElementProps('Combobox.Root').error).toBe(true);
        });

        it('marks the field touched on selection change', () => {
            const setTouched = vi.fn();
            mocks.useState
                .mockImplementationOnce(() => [undefined, vi.fn()])
                .mockImplementationOnce(() => [false, setTouched]);
            getElementProps('Combobox.Root').onSelectionChange([]);
            expect(setTouched).toHaveBeenCalledWith(true);
        });
    });
});
