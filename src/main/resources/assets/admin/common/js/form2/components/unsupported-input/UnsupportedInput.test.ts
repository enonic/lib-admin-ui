import {describe, expect, it, vi} from 'vitest';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {OccurrencesBuilder} from '../../../form/Occurrences';

vi.mock('../../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

describe('UnsupportedInput', () => {
    describe('type name extraction', () => {
        it('should extract type name from Input descriptor', () => {
            // Arrange
            const input = new InputBuilder()
                .setName('myField')
                .setInputType(new InputTypeName('CustomWidget', false))
                .setLabel('My Field')
                .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                .setHelpText('')
                .setInputTypeConfig({})
                .build();

            // Act
            const typeName = input.getInputType().getName();

            // Assert
            expect(typeName).toBe('CustomWidget');
        });

        it('should extract custom type name', () => {
            // Arrange
            const input = new InputBuilder()
                .setName('myField')
                .setInputType(new InputTypeName('MyApp:custom-input', true))
                .setLabel('Custom')
                .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
                .setHelpText('')
                .setInputTypeConfig({})
                .build();

            // Act
            const typeName = input.getInputType().getName();

            // Assert
            expect(typeName).toBe('MyApp:custom-input');
        });
    });
});
