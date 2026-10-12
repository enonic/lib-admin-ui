import {ItemJson} from '../../item/ItemJson';
import type {FormJson} from '@enonic/ui-types';

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
