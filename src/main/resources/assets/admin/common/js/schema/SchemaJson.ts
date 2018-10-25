module api.schema {

    import ItemJson = api.item.ItemJson;

    export interface SchemaJson
        extends ItemJson {

        displayName: string;

        description: string;

        name: string;

        iconUrl: string;
    }
}
