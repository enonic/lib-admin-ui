import {DivEl} from '../../dom/DivEl';
import {Element, NewElementBuilder} from '../../dom/Element';
import {H1El} from '../../dom/H1El';
import {H4El} from '../../dom/H4El';
import {ImageLoader} from '../../util/loader/ImageLoader';
import {ImgEl} from '../../dom/ImgEl';
import {ImgHelper} from '../../dom/ImgElHelper';
import {SpanEl} from '../../dom/SpanEl';
import {ViewItem} from './ViewItem';
import * as Q from 'q';

export class ItemStatisticsHeader
    extends DivEl {

    protected browseItem: ViewItem;

    protected iconEl: Element;

    protected readonly headerTitleEl: H1El;

    protected readonly headerPathEl: H4El;

    protected readonly iconBlock: Element;

    constructor() {
        super('header');

        this.iconBlock = new DivEl('icon-block');
        this.headerTitleEl = new H1El('title');
        this.headerPathEl = new H4El('path');
    }

    setItem(item: ViewItem) {
        this.browseItem = item;
        this.iconEl?.remove();

        if (!item) {
            return;
        }

        this.iconEl = this.createIconEl().addClass('font-icon-default');
        this.iconBlock.appendChild(this.iconEl);

        const displayName: string = item.getDisplayName() || '';
        this.headerTitleEl.setHtml(displayName);
        this.headerTitleEl.getEl().setAttribute('title', displayName);

        this.headerPathEl.removeChildren();
    }

    setIconUrl(value: string) {
        this.iconEl?.remove();

        const size: number = this.getIconSize();
        const icon: HTMLImageElement = ImageLoader.get(value, size, size);

        this.iconEl = <ImgEl> new Element(new NewElementBuilder().setTagName('img').setHelper(new ImgHelper(icon)));
        this.iconBlock.appendChild(this.iconEl);
    }

    setHeaderSubtitle(value: string, className: string) {
        this.headerPathEl.removeChildren();
        this.appendToHeaderPath(value, className);
    }

    private createIconEl() {
        if (typeof this.browseItem.getIconSrc === 'function' && this.browseItem.getIconSrc()) {
            return new ImgEl(this.browseItem.getIconSrc());
        }

        if (this.browseItem.getIconUrl()) {
            const size: number = this.getIconSize();
            const icon: HTMLImageElement = ImageLoader.get(this.browseItem.getIconUrl(), size, size);
            return new Element(new NewElementBuilder().setTagName('img').setHelper(new ImgHelper(icon)));
        }

        return new DivEl(this.browseItem.getIconClass());
    }

    protected appendToHeaderPath(value: string, className: string) {
        const pathName: SpanEl = new SpanEl(className);
        pathName.getEl().setInnerHtml(value);
        this.headerPathEl.appendChild(pathName);
    }

    protected getIconSize(): number {
        return 64;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.appendChild(this.iconBlock);

            const titleAndPathBlock: DivEl = new DivEl('names-block');
            titleAndPathBlock.appendChildren(this.headerTitleEl, this.headerPathEl);
            this.appendChild(titleAndPathBlock);

            return rendered;
        });
    }
}
