import {FormItemJson} from './FormItemJson';
import {OccurrencesJson} from './OccurrencesJson';

export interface FormSetJson
    extends FormItemJson {

    helpText?: string;

    label: string;

    occurrences: OccurrencesJson;
}
