module api.ui.locale {

    import DivEl = api.dom.DivEl;

    export interface NonstandardCodes {
        [key: string]: string;
    }

    export interface FlagData {
        code: string;
        classCode: string;
    }

    export class Flag
        extends DivEl {

        private static CODE_NONE: string = 'none';

        private static CODE_UNKNOWN: string = 'unknown';

        private static NONSTANDARD_CODES: NonstandardCodes = Object.freeze({
            'ast-es': 'es',
            'af-na': 'na',
            'af-za': 'za',
            'an-as': 'ws',
            'bm-ml': 'ml',
            'ca-ad': 'ad',
            'ca-es': 'es-ct',
            'cy-gb': 'gb',
            'da-gl': 'gl',
            'de-at': 'at',
            'de-be': 'be',
            'de-ch': 'ch',
            'de-lu': 'lu',
            'en-nu': 'gb-eng',
            'en-ms': 'gb-eng',
            'en-gg': 'gb-eng',
            'en-jm': 'gb-eng',
            'en-zm': 'gb-eng',
            'en-mt': 'gb-eng',
            'en-lr': 'gb-eng',
            'en-gh': 'gb-eng',
            'en-il': 'gb-eng',
            'en-pw': 'gb-eng',
            'en-vc': 'gb-eng',
            'en-150': 'gb-eng',
            'en-kn': 'gb-eng',
            'en-mo': 'gb-eng',
            'en-bz': 'gb-eng',
            'en-nr': 'gb-eng',
            'en-mp': 'gb-eng',
            'en-gd': 'gb-eng',
            'en-bw': 'gb-eng',
            'en-cy': 'gb-eng',
            'en-rw': 'gb-eng',
            'en-ie': 'gb-eng',
            'en-ki': 'gb-eng',
            'en-sz': 'gb-eng',
            'en-as': 'gb-eng',
            'en-je': 'gb-eng',
            'en-cx': 'gb-eng',
            'en-at': 'gb-eng',
            'en-sx': 'gb-eng',
            'en-tz': 'gb-eng',
            'en-pr': 'gb-eng',
            'en-ke': 'gb-eng',
            'en-nl': 'gb-eng',
            'en-ss': 'gb-eng',
            'en-mg': 'gb-eng',
            'en-za': 'gb-eng',
            'en-tv': 'gb-eng',
            'en-pn': 'gb-eng',
            'en-mh': 'gb-eng',
            'en-gy': 'gb-eng',
            'en-ng': 'gb-eng',
            'en-pk': 'gb-eng',
            'en-lc': 'gb-eng',
            'en-tt': 'gb-eng',
            'en-vu': 'gb-eng',
            'en-nf': 'gb-eng',
            'en-gu': 'gb-eng',
            'en-ai': 'gb-eng',
            'en-to': 'gb-eng',
            'en-pg': 'gb-eng',
            'en-er': 'gb-eng',
            'en-ph': 'gb-eng',
            'en-dm': 'gb-eng',
            'en-ck': 'gb-eng',
            'en-bi': 'gb-eng',
            'en-ag': 'gb-eng',
            'en-ws': 'gb-eng',
            'en-na': 'gb-eng',
            'en-sl': 'gb-eng',
            'en-sh': 'gb-eng',
            'en-ky': 'gb-eng',
            'en-dk': 'gb-eng',
            'en-zw': 'gb-eng',
            'en-um': 'gb-eng',
            'en-tk': 'gb-eng',
            'en-si': 'gb-eng',
            'en-fm': 'gb-eng',
            'en-be': 'gb-eng',
            'en-sg': 'gb-eng',
            'en-ch': 'gb-eng',
            'en-sd': 'gb-eng',
            'en-my': 'gb-eng',
            'en-fk': 'gb-eng',
            'en-gm': 'gb-eng',
            'en-dg': 'gb-eng',
            'en-se': 'gb-eng',
            'en-001': 'gb-eng',
            'en-sb': 'gb-eng',
            'en-mw': 'gb-eng',
            'en-io': 'gb-eng',
            'en-de': 'gb-eng',
            'en-cc': 'gb-eng',
            'en-fi': 'gb-eng',
            'en-sc': 'gb-eng',
            'en-vi': 'gb-eng',
            'en-ug': 'gb-eng',
            'en-nz': 'gb-eng',
            'en-fj': 'gb-eng',
            'en-mu': 'gb-eng',
            'en-im': 'gb-eng',
            'en-ls': 'gb-eng',
            'en-hk': 'gb-eng',
            'en-gi': 'gb-eng',
            'en-vg': 'gb-eng',
            'en-tc': 'gb-eng',
            'en-in': 'gb-eng',
            'en-gb': 'gb',
            'en-us': 'us',
            'en-us-posix': 'us',
            'mgh-mz': 'mz',
            agq: Flag.CODE_NONE,
            asa: Flag.CODE_NONE,
            ast: Flag.CODE_NONE,
            bas: Flag.CODE_NONE,
            bem: 'za',
            bez: Flag.CODE_NONE,
            brx: Flag.CODE_NONE,
            ccp: Flag.CODE_NONE,
            cgg: Flag.CODE_NONE,
            chr: Flag.CODE_NONE,
            ckb: Flag.CODE_NONE,
            dav: Flag.CODE_NONE,
            dje: Flag.CODE_NONE,
            fil: 'ph',
            gsw: 'sw',
            kea: Flag.CODE_NONE,
            khq: Flag.CODE_NONE,
            kok: Flag.CODE_NONE,
            lag: Flag.CODE_NONE,
            lkt: Flag.CODE_NONE,
            lrc: Flag.CODE_NONE,
            luo: Flag.CODE_NONE,
            luy: Flag.CODE_NONE,
            mas: Flag.CODE_NONE,
            mer: Flag.CODE_NONE,
            mfe: 'mu',
            mgh: Flag.CODE_NONE,
            mua: Flag.CODE_NONE,
            mzn: Flag.CODE_NONE,
            nus: Flag.CODE_NONE,
            prg: Flag.CODE_NONE,
            rof: Flag.CODE_NONE,
            rwk: Flag.CODE_NONE,
            sah: Flag.CODE_NONE,
            saq: Flag.CODE_NONE,
            sbp: Flag.CODE_NONE,
            shi: Flag.CODE_NONE,
            smn: Flag.CODE_NONE,
            twq: Flag.CODE_NONE,
            tzm: Flag.CODE_NONE,
            vai: Flag.CODE_NONE,
            af: Flag.CODE_NONE,
            be: 'by',
            bm: Flag.CODE_NONE,
            br: 'fr',
            bs: Flag.CODE_NONE,
            ca: Flag.CODE_NONE,
            cs: 'cz',
            cu: Flag.CODE_NONE,
            cy: 'gb-wls',
            da: 'dk',
            ee: Flag.CODE_NONE,
            el: 'gr',
            en: 'gb-eng',
            et: 'ee',
            eu: Flag.CODE_NONE,
            ga: 'ie',
            gd: 'gb-sct',
            gl: Flag.CODE_NONE,
            he: 'il',
            hi: 'in',
            ja: 'jp',
            ki: Flag.CODE_NONE,
            kw: Flag.CODE_NONE,
            ko: 'kr',
            ma: 'ms',
            om: Flag.CODE_NONE,
            se: Flag.CODE_NONE,
            sg: 'cf',
            sq: 'al',
            sr: 'rs',
            sv: 'se',
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
            const codeData = this.mapCode((countryCode || ''));
            const oldCodeData = this.mapCode(oldCountryCode);
            const countryClass = Flag.createCountryClass(codeData.classCode);
            const oldCountryClass = Flag.createCountryClass(oldCodeData.classCode);
            this.updateDataAttribute(codeData.code);
            this.removeClass(oldCountryClass);
            this.addClass(countryClass);
            this.countryCode = countryCode || '';
        }

        private updateDataAttribute(code?: string) {
            const hasCode = !api.util.StringHelper.isEmpty(code);
            if (hasCode) {
                this.getEl().setAttribute('data-code', code);
            } else {
                this.getEl().removeAttribute('data-code');
            }
        }

        protected static createCountryClass(code: string) {
            return `flag-icon-${code || Flag.CODE_UNKNOWN}`;
        }

        protected mapCode(countryCode: string): FlagData {
            const codeMap = this.getCodeMap();
            const fullCode = countryCode.toLowerCase();
            const longCode = fullCode.slice(0, 3);
            const shortCode = fullCode.slice(0, 2);

            const classCode = codeMap[fullCode] || codeMap[longCode] || codeMap[shortCode] || shortCode;
            const code = (this.hasNoFlag(classCode) || !this.isShortCode(classCode)) ? shortCode : classCode;

            return {code, classCode};
        }

        protected hasNoFlag(classCode: string): boolean {
            return classCode === Flag.CODE_NONE;
        }

        protected isShortCode(classCode: string): boolean {
            return classCode.length === 2 || classCode.length === 1;
        }

        protected getCodeMap(): NonstandardCodes {
            return Flag.NONSTANDARD_CODES;
        }
    }
}
