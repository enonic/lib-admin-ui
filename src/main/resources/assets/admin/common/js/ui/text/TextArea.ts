module api.ui.text {

    import FormInputEl = api.dom.FormInputEl;

    export class TextArea
        extends api.dom.CompositeFormInputEl {

        private attendant: api.dom.Element;

        private clone: api.dom.Element;

        private area: FormInputEl;

        constructor(name: string, originalValue?: string) {
            super();
            this.addClass('text-area');

            this.area = new FormInputEl('textarea', undefined, undefined, originalValue);
            this.area.getEl().setAttribute('name', name);

            this.setWrappedInput(this.area);

            this.onInput(() => {
                this.refreshDirtyState();
                this.refreshValueChanged();
            });

            this.clone = new api.dom.DivEl('autosize-clone').addClass(this.area.getEl().getAttribute('class'));
            this.attendant = new api.dom.DivEl('autosize-attendant');
            this.attendant.appendChild(this.clone);

            this.onAdded(() => this.attendant.insertAfterEl(this.area));

            this.onShown(() => this.updateSize());
            this.onFocus(() => this.updateSize());
            this.onValueChanged(() => this.updateSize());
            api.dom.WindowDOM.get().onResized(() => this.updateSize(), this);
        }

        setRows(rows: number) {
            this.area.getEl().setAttribute('rows', rows.toString());
        }

        setColumns(columns: number) {
            this.area.getEl().setAttribute('cols', columns.toString());
        }

        private updateSize() {
            if (this.isRendered()) {
                this.clone.getEl().setInnerHtml(this.getValue() + ' ');
                this.area.getEl().setHeightPx(this.clone.getEl().getHeightWithBorder());
            }
        }

        setReadOnly(readOnly: boolean) {
            super.setReadOnly(readOnly);

            if (readOnly) {
                this.getEl().setAttribute('readonly', 'readonly');
            } else {
                this.getEl().removeAttribute('readonly');
            }
        }
    }

}
