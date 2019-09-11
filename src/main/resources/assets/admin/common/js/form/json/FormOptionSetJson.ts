import {FormSetJson} from './FormSetJson';
import {FormOptionSetOptionJson} from './FormOptionSetOptionJson';
import {OccurrencesJson} from './OccurrencesJson';

export interface FormOptionSetJson
    extends FormSetJson {

    expanded?: boolean;

    options: FormOptionSetOptionJson[];

    multiselection: OccurrencesJson;
}
