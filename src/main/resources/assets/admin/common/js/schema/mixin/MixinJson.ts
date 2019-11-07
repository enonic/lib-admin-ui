import {SchemaJson} from '../SchemaJson';
import {FormJson} from '../../form/json/FormJson';

export interface MixinJson
    extends SchemaJson {
    form: FormJson;
}
