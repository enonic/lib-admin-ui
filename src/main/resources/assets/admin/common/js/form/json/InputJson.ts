import {FormItemJson} from './FormItemJson';
import {OccurrencesJson} from './OccurrencesJson';

export interface InputJson
    extends FormItemJson {

    helpText?: string;

    label: string;

    occurrences: OccurrencesJson;

    inputType: string;

    config?: any;
}
