module api.content.image {

    export class ImageSelectorViewer
        extends api.ui.NamesAndIconViewer<ImageTreeSelectorItem> {

        constructor() {
            super();
        }

        resolveDisplayName(object: ImageTreeSelectorItem): string {
            return object.getDisplayName();
        }

        resolveUnnamedDisplayName(object: ImageTreeSelectorItem): string {
            return object.getTypeLocaleName();
        }

        resolveSubName(object: ImageTreeSelectorItem, relativePath: boolean = false): string {
            return object.getPath() ? object.getPath().toString() : '';
        }

        resolveIconUrl(object: ImageTreeSelectorItem): string {
            return object.getImageUrl() + '&size=270';
        }
    }
}
