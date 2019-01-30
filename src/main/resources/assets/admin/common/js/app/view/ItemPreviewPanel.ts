module api.app.view {

    import DivEl = api.dom.DivEl;
    import LoadMask = api.ui.mask.LoadMask;
    import IFrameEl = api.dom.IFrameEl;
    import Panel = api.ui.panel.Panel;

    export class ItemPreviewPanel<M extends api.Equitable>
        extends Panel {

        protected frame: IFrameEl;

        protected frameWrapper: DivEl;

        protected toolbar: ItemPreviewToolbar<M>;

        protected mask: LoadMask;

        constructor(className?: string) {
            super('item-preview-panel' + (className ? ' ' + className : ''));
            this.toolbar = this.createToolbar();
            this.mask = new LoadMask(this);
            this.frame = new IFrameEl();
            this.frame.onLoaded(() => this.mask.hide());
            this.frameWrapper = new DivEl('frame-wrapper');
            this.frameWrapper.appendChild(this.frame);
            this.appendChildren(this.toolbar, this.frameWrapper, this.mask);
        }

        createToolbar(): ItemPreviewToolbar<M> {
            return new ItemPreviewToolbar<M>();
        }
    }
}
