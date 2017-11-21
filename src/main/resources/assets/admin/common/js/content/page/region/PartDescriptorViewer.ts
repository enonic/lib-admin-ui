module api.content.page.region {

    export class PartDescriptorViewer extends api.ui.NamesAndIconViewer<PartDescriptor> {

        constructor() {
            super();
        }

        resolveDisplayName(object: PartDescriptor): string {
            return object.getDisplayName();
        }

        resolveSubName(object: PartDescriptor): string {
            return object.getKey().toString();
        }

        resolveIconClass(): string {
            return api.StyleHelper.getCommonIconCls('part') + ' icon-large';
        }
    }
}
