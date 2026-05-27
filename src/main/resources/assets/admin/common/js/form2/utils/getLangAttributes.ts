const RTL_LANGUAGE_CODES: ReadonlySet<string> = new Set([
    'ar',
    'dv',
    'fa',
    'ha',
    'he',
    'ks',
    'ku',
    'ps',
    'sd',
    'ur',
    'yi',
]);

const ARABIC_SCRIPT_SUBTAG = 'arab';

export type LangAttributes = {
    lang?: string;
    dir?: 'rtl';
    spellCheck: true;
};

function isRtl(locale: string, language: string): boolean {
    if (RTL_LANGUAGE_CODES.has(language)) return true;
    return locale.split('-')[1]?.toLowerCase() === ARABIC_SCRIPT_SUBTAG;
}

export function getLangAttributes(locale: string | undefined): LangAttributes {
    if (locale == null || locale.length === 0) return {spellCheck: true};

    const normalized = locale.toLowerCase();
    const language = normalized.split('-')[0];
    const attrs: LangAttributes = {lang: language, spellCheck: true};

    if (isRtl(normalized, language)) attrs.dir = 'rtl';

    return attrs;
}
