module api.content.page {

    export class PageTemplateViewer extends api.ui.NamesAndIconViewer<PageTemplate> {

        constructor() {
            super();
        }

        resolveDisplayName(object: PageTemplate): string {
            return object.getDisplayName();
        }

        resolveSubName(object: PageTemplate): string {
            return object.getController().toString();
        }

        resolveIconClass(): string {
            return 'icon-newspaper icon-large';
        }
    }
}
