module api.ui.locale {

    import DivEl = api.dom.DivEl;

    interface NonstandardCodes {
        [key: string]: string;
    }

    export class Flag
        extends DivEl {

        private static CODE_NONE: string = 'none';

        private static NONSTANDARD_CODES: NonstandardCodes = Object.freeze({
            bem: 'za',
            bez: Flag.CODE_NONE,
            be: 'by',
            cs: 'cz',
            da: 'dk',
            el: 'gr',
            en: 'gb',
            he: 'il',
            hi: 'in',
            ja: 'jp',
            ko: 'kr',
            sq: 'al',
            sr: 'rs',
            uk: 'ua',
            zh: 'cn'
        });

        constructor(countryCode: string, literal: boolean = false, className: string = '') {
            super('flag-icon flag-icon-squared flag');

            const code = Flag.mapCode(countryCode.toLowerCase());
            const countryClass = literal ? '' : `flag-icon-${code || Flag.CODE_NONE}`;
            const classNames = `${countryClass} ${className}`.trim();
            this.addClass(classNames);
            this.getEl().setAttribute('data-code', code);
        }

        private static mapCode(countryCode: string): string {
            const longCode = countryCode.slice(0, 3);
            const shortCode = countryCode.slice(0, 2);
            return Flag.NONSTANDARD_CODES[longCode] || Flag.NONSTANDARD_CODES[shortCode] || countryCode;
        }
    }
}
