import {SchemaJson} from '../SchemaJson';
import type {FormJson} from '@enonic/ui-types';

export interface MixinJson
    extends SchemaJson {
    form: FormJson;
}
