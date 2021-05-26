import {FormSetJson} from './FormSetJson';
import {FormItemTypeWrapperJson} from './FormItemTypeWrapperJson';

export interface FormItemSetJson
    extends FormSetJson {

    immutable?: boolean;

    items: FormItemTypeWrapperJson[];
}
