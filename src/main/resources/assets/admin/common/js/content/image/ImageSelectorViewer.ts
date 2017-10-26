module api.content.image {

    export class ImageSelectorViewer
        extends api.ui.NamesAndIconViewer<ImageTreeSelectorItem> {

        constructor() {
            super();
        }

        doLayout(object: api.content.image.ImageTreeSelectorItem): any {
            super.doLayout(object);

            this.getNamesAndIconView().getIconImageEl().getEl().setAttribute('data-contentid', object.getContentId().toString());
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
            return object.getImageUrl() + '?crop=false';
        }
    }
}
