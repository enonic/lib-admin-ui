module api.content {

    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;

    export class ContentTreeSelectorItemViewer
        extends api.ui.NamesAndIconViewer<ContentTreeSelectorItem> {

        constructor() {
            super('content-summary-viewer');
        }

        resolveDisplayName(object: ContentTreeSelectorItem): string {
            let contentName = object.getName();
            let invalid = !object.isValid() || !object.getDisplayName() || contentName.isUnnamed();
            let pendingDelete = object.getContentState().isPendingDelete();
            this.toggleClass('invalid', invalid);
            this.toggleClass('pending-delete', pendingDelete);

            return object.getDisplayName();
        }

        resolveUnnamedDisplayName(object: ContentTreeSelectorItem): string {
            return object.getType() ? object.getType().getLocalName() : '';
        }

        resolveSubName(object: ContentTreeSelectorItem, relativePath: boolean = false): string {
            let contentName = object.getName();
            if (relativePath) {
                return !contentName.isUnnamed() ? object.getName().toString() : api.content.ContentUnnamed.prettifyUnnamed();
            } else {
                return !contentName.isUnnamed() ? object.getPath().toString() : ContentPath.fromParent(object.getPath().getParentPath(),
                    api.content.ContentUnnamed.prettifyUnnamed()).toString();
            }
        }

        resolveSubTitle(object: ContentTreeSelectorItem): string {
            return object.getPath().toString();
        }

        resolveIconUrl(object: ContentTreeSelectorItem): string {
            if (object) {
                return new api.content.util.ContentIconUrlResolver().setContent(object.getContent()).resolve();
            }
        }
    }
}
