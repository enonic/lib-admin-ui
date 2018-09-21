module api.schema.mixin {

    export interface MixinJson extends api.schema.SchemaJson {

        form:api.form.json.FormJson;

        isOptional: boolean;

    }
}
