import {PropertyArrayJson} from '../data/PropertyArrayJson';

export interface IdProviderConfigJson {
    applicationKey: string;
    config: readonly PropertyArrayJson[];
}
