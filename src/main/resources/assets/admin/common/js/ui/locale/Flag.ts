module api.ui.locale {

    import DivEl = api.dom.DivEl;

    export interface NonstandardCodes {
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

        private countryCode: string;

        constructor(countryCode: string, className: string = '') {
            super('flag-icon flag-icon-squared flag');
            if (!api.util.StringHelper.isEmpty(className)) {
                this.addClass(className);
            }
            this.updateCountryCode(countryCode);
        }

        updateCountryCode(countryCode: string) {
            const oldCountryCode = this.countryCode || '';
            const code = this.mapCode(countryCode.toLowerCase());
            const oldCode = this.mapCode(oldCountryCode.toLowerCase());
            const countryClass = Flag.createCountryClass(code);
            const oldCountryClass = Flag.createCountryClass(oldCode);
            this.getEl().setAttribute('data-code', code);
            this.addClass(countryClass);
            this.removeClass(oldCountryClass);
            this.countryCode = countryCode;
        }

        protected static createCountryClass(code: string) {
            return `flag-icon-${code || Flag.CODE_NONE}`;
        }

        protected mapCode(countryCode: string): string {
            const codeMap = this.getCodeMap();
            const longCode = countryCode.slice(0, 3);
            const shortCode = countryCode.slice(0, 2);
            return codeMap[longCode] || codeMap[shortCode] || shortCode;
        }

        protected getCodeMap(): NonstandardCodes {
            return Flag.NONSTANDARD_CODES;
        }
    }
}
