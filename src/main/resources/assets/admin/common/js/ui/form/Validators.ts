import {i18n} from '../../util/Messages';
import {FormInputEl} from '../../dom/FormInputEl';
import {StringHelper} from '../../util/StringHelper';

export class Validators {

    public static required(input: FormInputEl): string {
        return StringHelper.isBlank(input.getValue()) ? i18n('field.value.required') : undefined;
    }

    public static validEmail(input: FormInputEl): string {
        const regex = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
        return !regex.test(input.getValue()) ? i18n('field.value.invalid') : undefined;
    }

    public static validUrl(input: FormInputEl): string {
        const regex = /^http(s):\/\/\w+(\.\w+)*(:[0-9]+)?((\/|\#).*)?(\?([^&=]+)=([^&=]+))?(?:&([^&=]+)=([^&=]+))*$/;
        return !regex.test(input.getValue()) ? i18n('field.value.invalid') : undefined;
    }

    public static validFtpUrl(input: FormInputEl): string {
        const regex = /^ftp:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/;
        return !regex.test(input.getValue()) ? i18n('field.value.invalid') : undefined;
    }

    public static validRelativeUrl(input: FormInputEl): string {
        const regex = /^[^\/]+\/[^\/].*$|^\/[^\/].*$/;
        return !regex.test(input.getValue()) ? i18n('field.value.invalid') : undefined;
    }
}
