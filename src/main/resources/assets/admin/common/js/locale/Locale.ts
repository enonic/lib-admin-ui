import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {LocaleJson} from './json/LocaleJson';

export class Locale
    implements Equitable {

    private static readonly TH: string = 'th-TH-u-nu-thai-x-lvariant-TH';
    private static readonly TH_TAG: string = 'th-TH-TH';
    private static readonly JP: string = 'ja-JP-u-ca-japanese-x-lvariant-JP';
    private static readonly JP_TAG: string = 'ja-JP-JP';
    private static readonly NO: string = 'nn-NO-x-lvariant-NY';
    private static readonly NO_TAG: string = 'nn-NO-NY';
    private static readonly RTL_CODES: string[] = ['ar', 'dv', 'fa', 'ha', 'he', 'iw', 'ji', 'ps', 'sd', 'ug', 'ur', 'yi'];

    private tag: string;
    private displayName: string;
    private language: string;
    private displayLanguage: string;
    private variant: string;
    private displayVariant: string;
    private country: string;
    private displayCountry: string;

    public static supportsRtl(code: string): boolean {
        return ObjectHelper.isDefined(code) && Locale.RTL_CODES.indexOf(Locale.extractLanguage(code)) > -1;
    }

    public static extractLanguage(value: string): string {
        return value.split('-')[0];
    }

    public static fromJson(json: LocaleJson): Locale {
        let l = new Locale();
        l.tag = json.tag;
        l.displayName = json.displayName;
        l.country = json.country;
        l.displayCountry = json.displayCountry;
        l.variant = json.variant;
        l.displayVariant = json.displayVariant;
        l.language = json.language;
        l.displayLanguage = json.displayLanguage;
        return l;
    }

    equals(other: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(other, Locale)) {
            return false;
        }
        let o = <Locale> other;
        return this.tag === o.tag &&
               this.displayName === o.displayName &&
               this.language === o.language &&
               this.displayLanguage === o.displayLanguage &&
               this.variant === o.variant &&
               this.displayVariant === o.displayVariant &&
               this.country === o.displayCountry &&
               this.displayCountry === o.displayCountry;
    }

    public getTag() {
        return this.tag;
    }

    public getId() {
        if (this.tag === 'nn-NO' && this.variant === 'NY') {
            return Locale.NO;
        }

        return this.tag;
    }

    // handling some special locale cases
    public getProcessedTag() {
        if (this.tag === Locale.JP) {
            return Locale.JP_TAG;
        }

        if (this.tag === Locale.TH) {
            return Locale.TH_TAG;
        }

        if (this.tag === 'nn-NO' && this.variant === 'NY') {
            return Locale.NO_TAG;
        }

        return this.tag;
    }

    public getDisplayName() {
        return this.displayName;
    }

    public getLanguage() {
        return this.language;
    }

    public getDisplayLanguage() {
        return this.displayLanguage;
    }

    public getVariant() {
        return this.variant;
    }

    public getDisplayVariant() {
        return this.displayVariant;
    }

    public getCountry() {
        return this.country;
    }

    public getDisplayCountry() {
        return this.displayCountry;
    }

}
