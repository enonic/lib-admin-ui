module api.ui.text {

    export class TextArea
        extends api.dom.FormInputEl {

        private attendant: api.dom.Element;

        private clone: api.dom.Element;

        constructor(name: string, originalValue?: string) {
            super('textarea', 'text-area', undefined, originalValue);
            this.getEl().setAttribute('name', name);

            this.onInput(() => {
                this.refreshDirtyState();
                this.refreshValueChanged();
            });

            this.clone = new api.dom.DivEl('autosize-clone').addClass(this.getEl().getAttribute('class'));
            this.attendant = new api.dom.DivEl('autosize-attendant');
            this.attendant.appendChild(this.clone);

            this.onAdded(() => this.attendant.insertAfterEl(this));
            this.onRendered(() => this.updateSize());
            this.onShown(() => this.updateSize());
            this.onFocus(() => this.updateSize());
            this.onValueChanged(() => this.updateSize());
            api.dom.WindowDOM.get().onResized(() => this.updateSize(), this);
        }

        setRows(rows: number) {
            this.getEl().setAttribute('rows', rows.toString());
        }

        setColumns(columns: number) {
            this.getEl().setAttribute('cols', columns.toString());
        }

        private updateSize() {
            if (this.isRendered()) {
                this.clone.getEl().setInnerHtml(this.getValue() + ' ');
                this.getEl().setHeightPx(this.clone.getEl().getHeightWithBorder());
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
