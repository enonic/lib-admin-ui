module api.ui.locale {

    import DivEl = api.dom.DivEl;

    interface NonstandardCodes {
        [key: string]: string;
    }

    export class Flag
        extends DivEl {

        static NONSTANDARD_CODES: NonstandardCodes = Object.freeze({
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

            const code = Flag.mapCode(countryCode.toLowerCase().slice(0, 2));
            const countryClass = literal ? '' : `flag-icon-${code || 'none'}`;
            const classNames = `${countryClass} ${className}`.trim();
            this.addClass(classNames);
            this.getEl().setAttribute('data-code', code);
        }

        private static mapCode(countryCode: string): string {
            return Flag.NONSTANDARD_CODES[countryCode] || countryCode;
        }
    }
}
