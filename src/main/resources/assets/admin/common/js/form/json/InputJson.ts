import {FormItemJson} from './FormItemJson';
import {OccurrencesJson} from './OccurrencesJson';

export interface InputJson
    extends FormItemJson {

    helpText?: string;

    immutable?: boolean;

    indexed?: boolean;

    label: string;

    occurrences: OccurrencesJson;

    validationRegexp?: string;

    inputType: string;

    config?: any;

    maximizeUIInputWidth?: boolean;

    defaultValue?: {
        type: string;
        value: any;
    };

}
