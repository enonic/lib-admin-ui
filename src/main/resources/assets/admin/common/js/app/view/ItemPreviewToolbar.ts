module api.app.view {

    export class ItemPreviewToolbar<M extends api.Equitable>
        extends api.ui.toolbar.Toolbar {

        private browseItem: ViewItem<M>;


        constructor(className?: string) {
            super('item-preview-toolbar' + (className ? ' ' + className : ''));

        }

        setItem(item: api.app.view.ViewItem<M>) {
            this.browseItem = item;
        }

        getItem(): ViewItem<M> {
            return this.browseItem;
        }
    }
}
