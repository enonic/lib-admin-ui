import {describe, expect, it, vi} from 'vitest';
import {InputBuilder} from '../../main/resources/assets/admin/common/js/form/Input';
import {InputTypeName} from '../../main/resources/assets/admin/common/js/form/InputTypeName';
import {OccurrencesBuilder} from '../../main/resources/assets/admin/common/js/form/Occurrences';

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('UnsupportedInput', () => {
    describe('type name extraction', () => {
        it('extracts type name from Input descriptor', () => {
            const input = new InputBuilder()
                .setName('myField')
                .setInputType(new InputTypeName('CustomWidget', false))
                .setLabel('My Field')
                .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                .setHelpText('')
                .setInputTypeConfig({})
                .build();

            expect(input.getInputType().getName()).toBe('CustomWidget');
        });

        it('extracts custom type name', () => {
            const input = new InputBuilder()
                .setName('myField')
                .setInputType(new InputTypeName('MyApp:custom-input', true))
                .setLabel('Custom')
                .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                .setHelpText('')
                .setInputTypeConfig({})
                .build();

            expect(input.getInputType().getName()).toBe('MyApp:custom-input');
        });
    });
});
