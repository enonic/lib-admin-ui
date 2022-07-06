import {i18n} from '../../util/Messages';
import {FormInputEl} from '../../dom/FormInputEl';
import {StringHelper} from '../../util/StringHelper';

export class Validators {

    public static required(input: FormInputEl): string | undefined {
        return StringHelper.isBlank(input.getValue()) ? i18n('field.value.required') : undefined;
    }

    public static validEmail(input: FormInputEl): string | undefined {
        const regex: RegExp = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
        return !regex.test(input.getValue()) ? i18n('field.value.invalid') : undefined;
    }

    public static validUrl(input: FormInputEl): string | undefined {
        //http://<host>:<port>/<path>?<query>#<fragment>

        const protocol: RegExp = /^http(s)?:\/\//;
        const domain: RegExp = /\w+(\.\w+)*/;
        const port: RegExp = /(:[0-9]+)?/   ;
        const path: RegExp = /((\/)+([A-z0-9\-\%]+\/)*[A-z0-9\-\%]*\/?)?/;
        const pathFile: RegExp = /(\.\w+)?/;
        const query: RegExp = Validators.getQueryRegExp();
        const fragment: RegExp = Validators.getFragmentRegExp();

        const regex: RegExp = Validators.getRegexFromArray([
            protocol,
            domain,
            port,
            path,
            pathFile,
            query,
            fragment
        ]);

        return Validators.stringContainsSingleBackslash(input.getValue()) || !Validators.isInputValueValid(regex, input)
            ? i18n('field.value.invalid')
            : undefined;
    }

    public static validFtpUrl(input: FormInputEl): string | undefined {
        //ftp://<user>:<password>@<host>:<port>/<cwd1>/<cwd2>/.../<cwdN>/<name>;type=<typecode>

        const protocol: RegExp = /^ftp:\/\//;
        const userWithoutPassword: RegExp = /([\w\d\S]+\@)?/;
        const userAndPassword: RegExp = /(([\w\d\S])+\:([\w\d\S])+\@)?/ ;
        const host: RegExp = /([a-zA-Z0-9][a-zA-Z0-9\.]*)+/;
        const port: RegExp = /(:[0-9]+)?/;
        const path: RegExp = /((\/)+([A-z0-9\-\%]+\/)*[A-z0-9\-\%]*)?/;
        const extension: RegExp = Validators.getExtensionRegExp();
        const typecode: RegExp = /(\;type=(a|i|d))?/;

        const regex: RegExp = Validators.getRegexFromArray([
            protocol,
            userWithoutPassword,
            userAndPassword,
            host,
            port,
            path,
            extension,
            typecode
        ]);

        return !Validators.isInputValueValid(regex, input) ? i18n('field.value.invalid') : undefined;
    }

    public static validRelativeUrl(input: FormInputEl): string | undefined {
        const startsWith: RegExp = /^([A-z0-9\-\%]|\/|\.\/|(\.\.\/)+)/;
        const path: RegExp = /(([A-z0-9\-\%]+\/?)+)?/;
        const extension: RegExp = Validators.getExtensionRegExp();
        const endWithSlash: RegExp = /(\/)?/;
        const query: RegExp = Validators.getQueryRegExp();
        const fragment: RegExp = Validators.getFragmentRegExp();

        const regex: RegExp = Validators.getRegexFromArray([
            startsWith,
            path,
            extension,
            endWithSlash,
            query,
            fragment
        ]);

        return !Validators.isInputValueValid(regex, input) ? i18n('field.value.invalid') : undefined;
    }

    private static getRegexFromArray(regexes: RegExp[]): RegExp {
        return new RegExp(regexes.map((regex: RegExp): string => regex.source).join(''));
    }

    private static getExtensionRegExp(): RegExp {
        return /(\.[A-z0-9\-\%]+)?/;
    }

    private static getQueryRegExp(): RegExp {
        return /(\?([^&=]+)=([^&=]+))?(?:&([^&=]+)=([^&=]+))*/;
    }

    private static getFragmentRegExp(): RegExp {
        return /(\#(\w|\?|\/|\:|\@|\-|\.|\_|\~|\!|\$|\&|\'|\(|\)|\*|\+|\,|\;|\=|(\%[0-9]{1,2}))+)*/;
    }

    private static isInputValueValid(regex: RegExp, input: FormInputEl): boolean {
        const matches: RegExpExecArray | null = regex.exec(input.getValue());
        return Boolean(matches && matches[0] === matches?.input);
    }

    private static stringContainsSingleBackslash(string: string): boolean {
        return (String.raw`${string}`).indexOf('\\') >= 0;
    }
}
