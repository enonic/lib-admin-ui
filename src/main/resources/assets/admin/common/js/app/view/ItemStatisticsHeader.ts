import Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Element, NewElementBuilder} from '../../dom/Element';
import {H1El} from '../../dom/H1El';
import {H4El} from '../../dom/H4El';
import {ImgEl} from '../../dom/ImgEl';
import {ImgHelper} from '../../dom/ImgElHelper';
import {SpanEl} from '../../dom/SpanEl';
import {ImageLoader} from '../../util/loader/ImageLoader';
import {ViewItem} from './ViewItem';

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

    setItem(item: ViewItem): void {
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

    setIconUrl(value: string): void {
        this.iconEl?.remove();
        this.iconEl = this.doCreateIconEl(value);
        this.iconBlock.appendChild(this.iconEl);
    }

    private doCreateIconEl(src: string): Element {
        const size: number = this.getIconSize();
        const icon: HTMLImageElement = ImageLoader.get(src, size, size);
        return new Element(new NewElementBuilder().setTagName('img').setHelper(new ImgHelper(icon)));
    }

    setHeaderSubtitle(value: string, className: string): void {
        this.headerPathEl.removeChildren();
        this.appendToHeaderPath(value, className);
    }

    private createIconEl(): Element {
        if (typeof this.browseItem.getIconSrc === 'function' && this.browseItem.getIconSrc()) {
            return new ImgEl(this.browseItem.getIconSrc());
        }

        if (this.browseItem.getIconUrl()) {
            return this.doCreateIconEl(this.browseItem.getIconUrl());
        }

        return new DivEl(this.browseItem.getIconClass());
    }

    protected appendToHeaderPath(value: string, className: string): void {
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
