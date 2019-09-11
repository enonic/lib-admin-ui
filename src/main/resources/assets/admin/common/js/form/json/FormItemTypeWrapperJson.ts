import {InputJson} from './InputJson';
import {FormItemSetJson} from './FormItemSetJson';
import {FieldSetJson} from './FieldSetJson';
import {FormOptionSetJson} from './FormOptionSetJson';
import {FormOptionSetOptionJson} from './FormOptionSetOptionJson';

export interface FormItemTypeWrapperJson {

    Input?: InputJson;

    FormItemSet?: FormItemSetJson;

    FieldSet?: FieldSetJson;

    FormOptionSet?: FormOptionSetJson;

    FormOptionSetOption?: FormOptionSetOptionJson;
}
