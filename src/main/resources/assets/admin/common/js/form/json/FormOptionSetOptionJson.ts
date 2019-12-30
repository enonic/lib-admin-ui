import {FormItemTypeWrapperJson} from './FormItemTypeWrapperJson';

export interface FormOptionSetOptionJson {

    name: string;

    label: string;

    defaultOption?: boolean;

    helpText?: string;

    items?: FormItemTypeWrapperJson[];
}
