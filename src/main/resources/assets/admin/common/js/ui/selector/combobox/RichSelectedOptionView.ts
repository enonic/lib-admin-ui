import * as Q from 'q';
import {NamesAndIconView, NamesAndIconViewBuilder} from '../../../app/NamesAndIconView';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from './BaseSelectedOptionView';
import {NamesAndIconViewSize} from '../../../app/NamesAndIconViewSize';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {Option} from '../Option';
import {StringHelper} from '../../../util/StringHelper';

export class RichSelectedOptionView<T>
    extends BaseSelectedOptionView<T> {

    private optionDisplayValue: T;

    private size: NamesAndIconViewSize;

    private draggable: boolean;

    private namesAndIconView: NamesAndIconView;

    constructor(builder: RichSelectedOptionViewBuilder<T>) {
        super(builder);

        this.optionDisplayValue = builder.option.getDisplayValue();
        this.size = builder.size;
        this.draggable = builder.draggable;
    }

    resolveIconUrl(_content: T): string {
        return '';
    }

    resolveTitle(_content: T): string {
        return '';
    }

    resolveSubTitle(_content: T): string {
        return '';
    }

    resolveIconClass(_content: T): string {
        return '';
    }

    setOption(option: Option<T>): any {
        super.setOption(option);

        this.setValues(option.getDisplayValue());
        this.optionDisplayValue = option.getDisplayValue();
    }

    doRender(): Q.Promise<boolean> {
        this.appendActionButtons();
        this.toggleClass('not-found', this.getOption().isEmpty() === true);
        this.appendChild(this.createView(this.optionDisplayValue).addClass('option-value'));

        return Q(true);
    }

    protected appendActionButtons() {
        if (this.draggable) {
            this.appendChild(new DivEl('drag-control'));
        }

        super.appendActionButtons();
    }

    protected createView(content: T): Element {

        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(this.size).build();

        this.setValues(content);

        return this.namesAndIconView;
    }

    protected getOptionDisplayValue(): T {
        return this.optionDisplayValue;
    }

    private setValues(values: T) {
        if (!this.namesAndIconView) {
            return;
        }
        this.namesAndIconView.setMainName(this.resolveTitle(values))
            .setSubName(this.resolveSubTitle(values));

        let url = this.resolveIconUrl(values);
        if (!StringHelper.isBlank(url)) {
            this.namesAndIconView.setIconUrl(url + (url.indexOf('?') === -1 ? '?' : '&') + 'crop=false');
        } else {
            this.namesAndIconView.setIconClass(this.resolveIconClass(values));
        }
    }
}

export class RichSelectedOptionViewBuilder<T> extends BaseSelectedOptionViewBuilder<T> {
    size: NamesAndIconViewSize = NamesAndIconViewSize.compact;
    draggable: boolean = false;

    setDraggable(value: boolean): RichSelectedOptionViewBuilder<T> {
        this.draggable = value;

        return this;
    }

    setSize(size: NamesAndIconViewSize): RichSelectedOptionViewBuilder<T> {
        this.size = size;

        return this;
    }

    build(): RichSelectedOptionView<T> {
        return new RichSelectedOptionView(this);
    }
}
