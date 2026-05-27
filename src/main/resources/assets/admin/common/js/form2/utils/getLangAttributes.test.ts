import {describe, expect, it} from 'vitest';
import {getLangAttributes} from './getLangAttributes';

describe('getLangAttributes', () => {
    describe('absent locale', () => {
        it('returns spellCheck only when locale is undefined', () => {
            expect(getLangAttributes(undefined)).toEqual({spellCheck: true});
        });

        it('returns spellCheck only when locale is empty string', () => {
            expect(getLangAttributes('')).toEqual({spellCheck: true});
        });
    });

    describe('language extraction', () => {
        it('extracts language from a region-qualified locale', () => {
            expect(getLangAttributes('en-US')).toEqual({lang: 'en', spellCheck: true});
        });

        it('passes a bare language code through', () => {
            expect(getLangAttributes('nb')).toEqual({lang: 'nb', spellCheck: true});
        });

        it('lowercases mixed-case input', () => {
            expect(getLangAttributes('NB-NO')).toEqual({lang: 'nb', spellCheck: true});
        });
    });

    describe('RTL detection', () => {
        it('adds dir=rtl for Arabic', () => {
            expect(getLangAttributes('ar-SA')).toEqual({lang: 'ar', dir: 'rtl', spellCheck: true});
        });

        it('adds dir=rtl for Hebrew', () => {
            expect(getLangAttributes('he')).toEqual({lang: 'he', dir: 'rtl', spellCheck: true});
        });

        it('adds dir=rtl for Persian with region subtag', () => {
            expect(getLangAttributes('fa-IR')).toEqual({lang: 'fa', dir: 'rtl', spellCheck: true});
        });

        it('adds dir=rtl when the script subtag is Arabic', () => {
            expect(getLangAttributes('ks-Arab')).toEqual({lang: 'ks', dir: 'rtl', spellCheck: true});
        });

        it('omits dir for non-RTL languages', () => {
            const result = getLangAttributes('de-DE');
            expect(result).toEqual({lang: 'de', spellCheck: true});
            expect(result.dir).toBeUndefined();
        });
    });
});
