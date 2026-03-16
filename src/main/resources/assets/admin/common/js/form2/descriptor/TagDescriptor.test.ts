import {describe, expect, it, vi} from 'vitest';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string) => `#${key}#`,
}));

import {ValueTypes} from '../../data/ValueTypes';
import {TagDescriptor} from './TagDescriptor';
import {TextLineDescriptor} from './TextLineDescriptor';

describe('TagDescriptor', () => {
    it('registers itself under the Tag type name', () => {
        expect(TagDescriptor.name).toBe('Tag');
    });

    it('reuses the TextLine value type and config parsing', () => {
        const rawConfig = {
            regexp: [{value: '^[A-Z]+$'}],
            maxLength: [{value: 12}],
            showCounter: [{value: true}],
        };

        expect(TagDescriptor.getValueType()).toBe(TextLineDescriptor.getValueType());
        expect(TagDescriptor.readConfig(rawConfig)).toEqual(TextLineDescriptor.readConfig(rawConfig));
    });

    it('validates values with the same text rules as TextLine', () => {
        const config = TagDescriptor.readConfig({maxLength: [{value: 3}]});
        const results = TagDescriptor.validate(ValueTypes.STRING.newValue('toolong'), config);

        expect(results).toEqual(TextLineDescriptor.validate(ValueTypes.STRING.newValue('toolong'), config));
        expect(results[0]?.message).toBeTruthy();
    });

    it('treats blank strings as missing for required validation', () => {
        expect(TagDescriptor.valueBreaksRequired(ValueTypes.STRING.newValue('   '))).toBe(true);
        expect(TagDescriptor.valueBreaksRequired(ValueTypes.STRING.newValue('alpha'))).toBe(false);
    });
});
