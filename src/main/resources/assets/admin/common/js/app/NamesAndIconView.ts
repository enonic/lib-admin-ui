import {DivEl} from '../dom/DivEl';
import {ImgEl} from '../dom/ImgEl';
import {Element} from '../dom/Element';
import {NamesView} from './NamesView';
import {SpanEl} from '../dom/SpanEl';
import {StyleHelper} from '../StyleHelper';
import {NamesAndIconViewSize} from './NamesAndIconViewSize';

export class NamesAndIconViewBuilder {

    size: NamesAndIconViewSize;

    addTitleAttribute: boolean = false;

    appendIcon: boolean = true;

    setSize(size: NamesAndIconViewSize): NamesAndIconViewBuilder {
        this.size = size;
        return this;
    }

    setAddTitleAttribute(addTitleAttribute: boolean): NamesAndIconViewBuilder {
        this.addTitleAttribute = addTitleAttribute;
        return this;
    }

    setAppendIcon(appendIcon: boolean): NamesAndIconViewBuilder {
        this.appendIcon = appendIcon;
        return this;
    }

    build(): NamesAndIconView {

        return new NamesAndIconView(this);
    }
}

export class NamesAndIconView
    extends DivEl {

    private wrapperDivEl: DivEl;

    private iconImageEl: ImgEl;

    private iconDivEl: DivEl;

    private iconEl: Element;

    private namesView: NamesView;

    private iconLabelEl: SpanEl;

    constructor(builder: NamesAndIconViewBuilder) {
        super('names-and-icon-view');
        const sizeClassName: string = NamesAndIconViewSize[builder.size];
        if (sizeClassName) {
            this.addClass(sizeClassName);
        }

        if (builder.appendIcon) {
            this.wrapperDivEl = new DivEl('wrapper', StyleHelper.COMMON_PREFIX);
            this.appendChild(this.wrapperDivEl);

            this.iconImageEl = new ImgEl(null, 'font-icon-default');
            this.iconImageEl.setDraggable('false');
            this.wrapperDivEl.appendChild(this.iconImageEl);

            this.iconDivEl = new DivEl('font-icon-default');
            this.wrapperDivEl.appendChild(this.iconDivEl);
            this.iconDivEl.hide();
        }

        this.namesView = new NamesView(builder.addTitleAttribute);
        this.appendChild(this.namesView);

        this.iconLabelEl = new SpanEl('icon-label', StyleHelper.COMMON_PREFIX);
        this.iconLabelEl.hide();
        this.appendChild(this.iconLabelEl);
    }

    static create(): NamesAndIconViewBuilder {
        return new NamesAndIconViewBuilder();
    }

    setMainName(value: string, escapeHtml: boolean = true): NamesAndIconView {
        this.namesView.setMainName(value, escapeHtml);
        return this;
    }

    setSubName(value: string, title?: string): NamesAndIconView {
        this.namesView.setSubName(value, title);
        return this;
    }

    setSubNameElements(elements: Element[]): NamesAndIconView {
        this.namesView.setSubNameElements(elements);
        return this;
    }

    setIconClass(value: string): NamesAndIconView {
        const cls: string = value.toLowerCase().trim();
        if (cls) {
            this.iconDivEl
                .setClass(`font-icon-default ${cls}`)
                .removeChildren()
                .show();

            this.iconImageEl.hide();
        } else {
            this.iconDivEl.setClass('font-icon-default').removeChildren();
        }

        return this;
    }

    setIconUrl(value: string): NamesAndIconView {
        this.iconImageEl.setSrc(value);
        this.iconDivEl.hide();
        this.iconImageEl.show();
        return this;
    }

    setIconEl(value: Element): NamesAndIconView {
        if (this.iconEl) {
            this.iconEl.remove();
        }
        this.iconEl = value;
        this.iconDivEl.appendChild(value).show();
        this.iconImageEl.hide();
        return this;
    }

    setDisplayIconLabel(display: boolean): NamesAndIconView {
        if (display) {
            this.iconLabelEl.show();
        } else {
            this.iconLabelEl.hide();
        }

        return this;
    }

    getNamesView(): NamesView {
        return this.namesView;
    }

    getIconImageEl(): ImgEl {
        return this.iconImageEl;
    }

    setIconToolTip(toolTip: string) {
        this.wrapperDivEl.getEl().setTitle(toolTip);
    }

    protected getWrapperDivEl(): DivEl {
        return this.wrapperDivEl;
    }

}
