import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

vi.mock('../../store/Store', () => {
    const storeMap = new Map<string, any>();
    return {
        Store: {
            instance: () => ({
                get: (key: string) => storeMap.get(key),
                set: (key: string, value: any) => {
                    storeMap.set(key, value);
                },
                has: (key: string) => storeMap.has(key),
                delete: (key: string) => storeMap.delete(key),
            }),
        },
    };
});

import {ValueTypes} from '../../data/ValueTypes';
import {type Input, InputBuilder, type RawInputConfig} from '../../form/Input';
import {InputTypeName} from '../../form/InputTypeName';
import {Occurrences} from '../../form/Occurrences';
import {DescriptorRegistry} from '../descriptor/DescriptorRegistry';
import type {TextLineConfig} from '../descriptor/InputTypeConfig';
import {initBuiltInDescriptors} from '../descriptor/initBuiltInDescriptors';

function makeInput(typeName: string, config: RawInputConfig | undefined = {}): Input {
    return new InputBuilder()
        .setName('testField')
        .setInputType(new InputTypeName(typeName, false))
        .setLabel('Test')
        .setOccurrences(Occurrences.minmax(0, 1))
        .setInputTypeConfig(config)
        .build();
}

describe('useInputTypeDescriptor — logic', () => {
    beforeEach(() => {
        initBuiltInDescriptors();
    });

    afterEach(() => {
        for (const [name] of DescriptorRegistry.getAll()) {
            DescriptorRegistry.unregister(name);
        }
    });

    describe('known type lookup', () => {
        it('returns descriptor and config for TextLine', () => {
            const input = makeInput('TextLine', {maxLength: [{value: 100}]});
            const descriptor = DescriptorRegistry.get<TextLineConfig>(input.getInputType().getName());

            expect(descriptor).toBeDefined();
            expect(descriptor?.name).toBe('TextLine');
            expect(descriptor?.getValueType()).toBe(ValueTypes.STRING);

            const config = descriptor?.readConfig(input.getInputTypeConfig() ?? {});
            expect(config?.maxLength).toBe(100);
        });

        it('parses config correctly for TextLine with regexp', () => {
            const input = makeInput('TextLine', {regexp: [{value: '^[A-Z]+$'}]});
            const descriptor = DescriptorRegistry.get<TextLineConfig>(input.getInputType().getName());

            const config = descriptor?.readConfig(input.getInputTypeConfig() ?? {});
            expect(config?.regexp).toBeInstanceOf(RegExp);
            expect(config?.regexp?.source).toBe('^[A-Z]+$');
        });
    });

    describe('unknown type', () => {
        it('returns undefined for unregistered type', () => {
            const input = makeInput('UnknownWidget');
            const descriptor = DescriptorRegistry.get(input.getInputType().getName());
            expect(descriptor).toBeUndefined();
        });
    });

    describe('case-insensitive lookup', () => {
        it('resolves descriptor regardless of case', () => {
            const lower = makeInput('textline');
            const upper = makeInput('TEXTLINE');
            const mixed = makeInput('TextLine');

            const d1 = DescriptorRegistry.get(lower.getInputType().getName());
            const d2 = DescriptorRegistry.get(upper.getInputType().getName());
            const d3 = DescriptorRegistry.get(mixed.getInputType().getName());

            expect(d1).toBeDefined();
            expect(d1).toBe(d2);
            expect(d2).toBe(d3);
        });
    });

    describe('config parsing produces typed config', () => {
        it('returns empty-like config for empty raw config', () => {
            const input = makeInput('TextLine', {});
            const descriptor = DescriptorRegistry.get<TextLineConfig>(input.getInputType().getName());

            const config = descriptor?.readConfig(input.getInputTypeConfig() ?? {});
            expect(config?.regexp).toBeUndefined();
            expect(config?.maxLength).toBe(-1);
            expect(config?.showCounter).toBe(false);
        });

        it('handles undefined config gracefully', () => {
            const input = makeInput('TextLine', undefined);
            const descriptor = DescriptorRegistry.get<TextLineConfig>(input.getInputType().getName());

            const config = descriptor?.readConfig(input.getInputTypeConfig() ?? {});
            expect(config?.regexp).toBeUndefined();
            expect(config?.maxLength).toBe(-1);
            expect(config?.showCounter).toBe(false);
        });
    });
});
