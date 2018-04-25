module api.ui.selector.combobox {

    import NamesAndIconView = api.app.NamesAndIconView;
    export class RichSelectedOptionView<T> extends api.ui.selector.combobox.BaseSelectedOptionView<T> {

        private optionDisplayValue: T;

        private size: api.app.NamesAndIconViewSize;

        private draggable: boolean;

        private namesAndIconView: NamesAndIconView;

        constructor(builder: RichSelectedOptionViewBuilder<T>) {
            super(builder.option);

            this.optionDisplayValue = builder.option.displayValue;
            this.size = builder.size;

            this.draggable = builder.draggable;
            this.setEditable(builder.editable);
            this.setRemovable(builder.removable);
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

        protected appendActionButtons() {
            if (this.draggable) {
                this.appendChild(new api.dom.DivEl('drag-control'));
            }

            super.appendActionButtons();
        }

        protected createView(content: T): api.dom.Element {

            this.namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(this.size).build();

            this.setValues(content);

            return this.namesAndIconView;
        }

        setOption(option: api.ui.selector.Option<T>): any {
            super.setOption(option);

            this.setValues(option.displayValue);
            this.optionDisplayValue = option.displayValue;
        }

        private setValues(values: T) {
            this.namesAndIconView.setMainName(this.resolveTitle(values))
                .setSubName(this.resolveSubTitle(values));

            let url = this.resolveIconUrl(values);
            if (!api.util.StringHelper.isBlank(url)) {
                this.namesAndIconView.setIconUrl(this.resolveIconUrl(values) + '?crop=false');
            } else {
                this.namesAndIconView.setIconClass(this.resolveIconClass(values));
            }
        }

        doRender(): wemQ.Promise<boolean> {
            this.appendActionButtons();
            this.appendChild(this.createView(this.optionDisplayValue));

            return wemQ(true);
        }

        protected getOptionDisplayValue(): T {
            return this.optionDisplayValue;
        }
    }

    export class RichSelectedOptionViewBuilder<T> {
        option: api.ui.selector.Option<T>;
        size: api.app.NamesAndIconViewSize = api.app.NamesAndIconViewSize.small;

        editable: boolean = false;
        draggable: boolean = false;
        removable: boolean = true;

        constructor(option: api.ui.selector.Option<T>) {
            this.option = option;
        }

        setEditable(value: boolean): RichSelectedOptionViewBuilder<T> {
            this.editable = value;

            return this;
        }

        setDraggable(value: boolean): RichSelectedOptionViewBuilder<T> {
            this.draggable = value;

            return this;
        }

        setRemovable(value: boolean): RichSelectedOptionViewBuilder<T> {
            this.removable = value;

            return this;
        }

        setSize(size: api.app.NamesAndIconViewSize): RichSelectedOptionViewBuilder<T> {
            this.size = size;

            return this;
        }

        build(): RichSelectedOptionView<T> {
            return new RichSelectedOptionView(this);
        }
    }
}
