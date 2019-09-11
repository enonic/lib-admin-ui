import {LayoutJson} from './LayoutJson';
import {LayoutTypeWrapperJson} from './LayoutTypeWrapperJson';

export interface FieldSetJson
    extends LayoutJson {

    items: LayoutTypeWrapperJson[];

    label: string;
}
