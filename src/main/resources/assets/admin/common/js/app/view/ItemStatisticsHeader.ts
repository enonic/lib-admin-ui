import {Equitable} from '../../Equitable';
import {DivEl} from '../../dom/DivEl';
import {Element, NewElementBuilder} from '../../dom/Element';
import {H1El} from '../../dom/H1El';
import {H4El} from '../../dom/H4El';
import {ImageLoader} from '../../util/loader/ImageLoader';
import {ImgEl} from '../../dom/ImgEl';
import {ImgHelper} from '../../dom/ImgElHelper';
import {SpanEl} from '../../dom/SpanEl';
import {ViewItem} from './ViewItem';

export class ItemStatisticsHeader<M extends Equitable>
    extends DivEl {

    private browseItem: ViewItem<M>;

    private iconEl: Element;

    private headerTitleEl: H1El;

    private headerPathEl: H4El;

    constructor() {
        super('header');
        this.headerTitleEl = new H1El('title');
        this.headerPathEl = new H4El('path');
        this.appendChild(this.headerTitleEl);
        this.appendChild(this.headerPathEl);
    }

    setItem(item: ViewItem<M>) {

        if (this.iconEl) {
            this.iconEl.remove();
        }

        if (item) {
            this.iconEl = this.createIconEl(item);
            this.prependChild(this.iconEl);

            let displayName = item.getDisplayName() || '';
            this.headerTitleEl.setHtml(displayName);
            this.headerTitleEl.getEl().setAttribute('title', displayName);

            this.headerPathEl.removeChildren();
            if (item.getPath()) {
                this.appendToHeaderPath(item.getPath(), 'parent-path');
                this.appendToHeaderPath(item.getPathName(), 'path-name');
            }
        }
        this.browseItem = item;
    }

    setIconUrl(value: string) {
        if (this.iconEl) {
            this.iconEl.remove();
        }

        let size = this.browseItem.getIconSize() || 64;
        let icon: HTMLImageElement = ImageLoader.get(value, size, size);

        this.iconEl = <ImgEl> new Element(new NewElementBuilder().setTagName('img').setHelper(
            new ImgHelper(icon)));

        this.prependChild(this.iconEl);
    }

    setHeaderSubtitle(value: string, className: string) {
        this.headerPathEl.removeChildren();
        this.appendToHeaderPath(value, className);
    }

    private createIconEl(item: ViewItem<M>) {
        let iconEl: Element;

        if (item.getIconUrl()) {
            let size = item.getIconSize() || 64;
            let icon: HTMLImageElement = ImageLoader.get(item.getIconUrl(), size, size);

            iconEl = <ImgEl> new Element(new NewElementBuilder().setTagName('img').setHelper(new ImgHelper(icon)));
        } else {
            iconEl = new DivEl(item.getIconClass());
        }

        iconEl.addClass('font-icon-default');

        return iconEl;
    }

    private appendToHeaderPath(value: string, className: string) {
        let pathName = new SpanEl(className);
        pathName.getEl().setInnerHtml(value);
        this.headerPathEl.appendChild(pathName);
    }
}
