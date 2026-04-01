import {ItemJson} from '../item/ItemJson';

export interface SchemaJson
    extends ItemJson {

    title: string;

    description: string;

    name: string;

    iconUrl: string;
}
