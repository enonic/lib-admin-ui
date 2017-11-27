module api.macro.resource {

    import ContentTypeSummaryListJson = api.schema.content.ContentTypeSummaryListJson;
    import PageDescriptorsJson = api.content.page.PageDescriptorsJson;
    import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
    import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
    import RelationshipTypeListJson = api.schema.relationshiptype.RelationshipTypeListJson;

    export interface ApplicationInfoJson {

        contentTypesJson: ContentTypeSummaryListJson;

        pagesJson: PageDescriptorsJson;

        partsJson: PartDescriptorsJson;

        layoutsJson: LayoutDescriptorsJson;

        relationsJson: RelationshipTypeListJson;

        macrosJson: MacrosJson;
    }
}
