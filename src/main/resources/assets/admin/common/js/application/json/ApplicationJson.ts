import {ItemJson} from '../../item/ItemJson';
import {FormJson} from '../../form/json/FormJson';

export interface ApplicationJson
    extends ItemJson {

    key: string;

    version: string;

    displayName: string;

    description: string;

    info: string;

    url: string;

    vendorName: string;

    vendorUrl: string;

    state: string;

    config: FormJson;

    idProviderConfig: FormJson;

    applicationDependencies: string[];

    contentTypeDependencies: string[];

    metaSteps: string[];

    minSystemVersion: string;

    maxSystemVersion: string;

    local: boolean;

    iconUrl: string;
}
