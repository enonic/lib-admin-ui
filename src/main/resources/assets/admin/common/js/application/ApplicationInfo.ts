module api.application {
    import ContentTypeSummary = api.schema.content.ContentTypeSummary;
    import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
    import RelationshipType = api.schema.relationshiptype.RelationshipType;
    import ApplicationInfoJson = api.macro.resource.ApplicationInfoJson;
    import PageDescriptor = api.content.page.PageDescriptor;
    import PartDescriptor = api.content.page.region.PartDescriptor;
    import MacroDescriptor = api.macro.MacroDescriptor;

    export class ApplicationInfo {

        contentTypes: ContentTypeSummary[];

        pages: PageDescriptor[];

        parts: PartDescriptor[];

        layouts: LayoutDescriptor[];

        relations: RelationshipType[];

        macros: MacroDescriptor[];

        static fromJson(json: ApplicationInfoJson): ApplicationInfo {
            let result = new ApplicationInfo();

            result.contentTypes = json.contentTypesJson ? ContentTypeSummary.fromJsonArray(json.contentTypesJson.contentTypes) : [];

            result.pages = (json.pagesJson && json.pagesJson.descriptors) ? json.pagesJson.descriptors.map(descriptorJson => {
                return PageDescriptor.fromJson(descriptorJson);
            }) : [];

            result.parts = (json.partsJson && json.partsJson.descriptors) ? json.partsJson.descriptors.map((descriptorJson => {
                return PartDescriptor.fromJson(descriptorJson);
            })) : [];

            result.layouts = (json.layoutsJson && json.layoutsJson.descriptors) ? json.layoutsJson.descriptors.map((descriptorJson => {
                return LayoutDescriptor.fromJson(descriptorJson);
            })) : [];

            result.relations = (json.relationsJson && json.relationsJson.relationshipTypes) ? json.relationsJson.relationshipTypes.map(
                (relationshipJson) => {
                    return RelationshipType.fromJson(relationshipJson);
                }) : [];

            result.macros = (json.macrosJson && json.macrosJson.macros) ? json.macrosJson.macros.map((macroJson) => {
                return MacroDescriptor.fromJson(macroJson);
            }) : [];

            return result;
        }
    }
}
