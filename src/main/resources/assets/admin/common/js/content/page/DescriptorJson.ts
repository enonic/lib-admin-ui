module api.content.page {

    export interface DescriptorJson {

        key: string;

        name: string;

        displayName: string;

        description: string;

        controller: string;

        config: api.form.json.FormJson;
    }
}
