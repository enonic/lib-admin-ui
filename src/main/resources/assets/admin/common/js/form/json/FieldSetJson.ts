import {FieldSetTypeWrapperJson} from './FieldSetTypeWrapperJson';
import {FormItemJson} from './FormItemJson';

export interface FieldSetJson
    extends FormItemJson {

    items: FieldSetTypeWrapperJson[];

    label: string;
}
