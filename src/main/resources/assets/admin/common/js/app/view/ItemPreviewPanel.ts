module api.app.view {

    export class ItemPreviewPanel<M extends api.Equitable>
        extends api.ui.panel.Panel {

        protected frame: api.dom.IFrameEl;

        protected toolbar: ItemPreviewToolbar<M>;

        protected mask: api.ui.mask.LoadMask;

        constructor(className?: string) {
            super('item-preview-panel' + (className ? ' ' + className : ''));
            this.toolbar = this.createToolbar();
            this.mask = new api.ui.mask.LoadMask(this);
            this.frame = new api.dom.IFrameEl();
            this.frame.onLoaded(() => this.mask.hide());
            this.appendChildren<api.dom.Element>(this.toolbar, this.frame, this.mask);
        }

        createToolbar(): ItemPreviewToolbar<M> {
            return new ItemPreviewToolbar<M>();
        }
    }
}
