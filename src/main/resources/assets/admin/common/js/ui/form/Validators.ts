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
        const domain: RegExp = /((?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*(\.[A-Za-z]{2,6})?)+/;
        const port: RegExp = Validators.getPortRegExp();
        const path: RegExp = Validators.getPathRegExp();
        const endWithSlash: RegExp = /(\/)?/;
        const extension: RegExp = Validators.getExtensionRegExp();
        const query: RegExp = Validators.getQueryRegExp();
        const fragment: RegExp = Validators.getFragmentRegExp();

        const regex: RegExp = Validators.getRegexFromArray([
            protocol,
            domain,
            port,
            path,
            endWithSlash,
            extension,
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
        const port: RegExp = Validators.getPortRegExp();
        const path: RegExp = Validators.getPathRegExp();
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

    private static getPortRegExp(): RegExp {
        return /(:[0-9]+)?/;
    }

    private static getPathRegExp(): RegExp {
        return /((\/)+([A-z0-9\-\%\.\…\:\§\,\+()]+\/{0,2})*)?/;
    }

    private static getExtensionRegExp(): RegExp {
        return /(\.[A-z0-9\-\%]+)?/;
    }

    private static getQueryRegExp(): RegExp {
        return /(\?([^&]+))?(?:&([^&]+))*/;
    }

    private static getFragmentRegExp(): RegExp {
        return /(\#(\w|\?|\/|\:|\@|\-|\.|\_|\~|\!|\$|\&|\'|\(|\)|\*|\+|\,|\;|\=|\%)+)*/;
    }

    private static isInputValueValid(regex: RegExp, input: FormInputEl): boolean {
        const matches: RegExpExecArray | null = regex.exec(input.getValue().trim());
        return Boolean(matches && matches[0] === matches?.input);
    }

    private static stringContainsSingleBackslash(string: string): boolean {
        return (String.raw`${string}`).indexOf('\\') >= 0;
    }
}
