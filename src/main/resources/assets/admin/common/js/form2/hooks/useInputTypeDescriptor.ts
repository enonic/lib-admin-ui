import {useMemo} from 'react';

import type {Input} from '../../form/Input';
import type {InputTypeConfig} from '../descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from '../descriptor/InputTypeDescriptor';
import {InputTypeRegistry} from '../registry/InputTypeRegistry';

export type UseInputTypeDescriptorResult<C extends InputTypeConfig = InputTypeConfig> = {
    descriptor: InputTypeDescriptor<C>;
    config: C;
};

export function useInputTypeDescriptor<C extends InputTypeConfig = InputTypeConfig>(
    input: Input,
): UseInputTypeDescriptorResult<C> | undefined {
    return useMemo(() => {
        const descriptor = InputTypeRegistry.getDescriptor<C>(input.getInputType().getName());
        if (descriptor == null) return undefined;

        const config = descriptor.readConfig(input.getInputTypeConfig() ?? {});

        return {descriptor, config};
    }, [input]);
}
