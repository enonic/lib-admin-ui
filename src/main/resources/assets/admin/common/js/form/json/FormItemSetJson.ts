import {FormSetJson} from './FormSetJson';
import {FormItemTypeWrapperJson} from './FormItemTypeWrapperJson';

export interface FormItemSetJson
    extends FormSetJson {

    customText?: string;

    immutable?: boolean;

    items: FormItemTypeWrapperJson[];
}
