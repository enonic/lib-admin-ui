module api.app.view {

    export class ItemPreviewToolbar<M extends api.Equitable>
        extends api.ui.toolbar.Toolbar {

        private item: M;

        constructor(className?: string) {
            super('item-preview-toolbar' + (className ? ' ' + className : ''));
        }

        setItem(item: M) {
            this.item = item;
        }

        getItem(): M {
            return this.item;
        }
    }
}
