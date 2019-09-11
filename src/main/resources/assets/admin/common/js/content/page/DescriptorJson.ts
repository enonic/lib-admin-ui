import {FormJson} from '../../form/json/FormJson';

export interface DescriptorJson {

    key: string;

    name: string;

    displayName: string;

    description: string;

    controller: string;

    config: FormJson;
}
