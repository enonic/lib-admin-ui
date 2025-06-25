import {useMemo} from 'react';

import type {Input} from '../../form/Input';
import {DescriptorRegistry} from '../descriptor/DescriptorRegistry';
import type {InputTypeConfig} from '../descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from '../descriptor/InputTypeDescriptor';

export type UseInputTypeDescriptorResult<C extends InputTypeConfig = InputTypeConfig> = {
    descriptor: InputTypeDescriptor<C>;
    config: C;
};

export function useInputTypeDescriptor<C extends InputTypeConfig = InputTypeConfig>(
    input: Input,
): UseInputTypeDescriptorResult<C> | undefined {
    return useMemo(() => {
        const descriptor = DescriptorRegistry.get<C>(input.getInputType().getName());
        if (descriptor == null) return undefined;

        const config = descriptor.readConfig(input.getInputTypeConfig() as Record<string, Record<string, unknown>[]>);

        return {descriptor, config};
    }, [input]);
}
