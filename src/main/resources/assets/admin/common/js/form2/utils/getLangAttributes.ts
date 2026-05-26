import {Locale} from '../../locale/Locale';

export type LangAttributes = {
    lang?: string;
    dir?: 'rtl';
    spellCheck: true;
};

export function getLangAttributes(locale: string | undefined): LangAttributes {
    if (locale == null || locale.length === 0) {
        return {spellCheck: true};
    }

    const language = Locale.extractLanguage(locale);
    const attrs: LangAttributes = {lang: language, spellCheck: true};

    if (Locale.supportsRtl(language)) {
        attrs.dir = 'rtl';
    }

    return attrs;
}
