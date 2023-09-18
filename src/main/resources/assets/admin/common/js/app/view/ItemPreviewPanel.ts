import {DivEl} from '../../dom/DivEl';
import {LoadMask} from '../../ui/mask/LoadMask';
import {IFrameEl} from '../../dom/IFrameEl';
import {Panel} from '../../ui/panel/Panel';
import {Equitable} from '../../Equitable';
import {ItemPreviewToolbar} from './ItemPreviewToolbar';

export class ItemPreviewPanel<M extends Equitable>
    extends Panel {

    protected frame: IFrameEl;

    protected wrapper: DivEl;

    protected toolbar: ItemPreviewToolbar<M>;

    protected mask: LoadMask;

    constructor(className?: string) {
        super('item-preview-panel' + (className ? ' ' + className : ''));
        this.toolbar = this.createToolbar();
        this.mask = new LoadMask(this);
        this.frame = new IFrameEl();
        this.wrapper = new DivEl('wrapper');
        this.wrapper.appendChild(this.frame);
        this.appendChildren(this.toolbar, this.wrapper, this.mask);
    }

    createToolbar(): ItemPreviewToolbar<M> {
        return new ItemPreviewToolbar<M>();
    }

    public showMask() {
        if (this.isVisible()) {
            this.mask.show();
        }
    }

    public hideMask() {
        this.mask.hide();
    }
}
