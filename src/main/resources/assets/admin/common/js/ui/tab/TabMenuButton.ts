module api.ui.tab {

    export class TabMenuButton extends api.dom.DivEl {

        private labelEl: api.dom.AEl;

        constructor() {
            super('tab-menu-button');

            this.labelEl = new api.dom.AEl('label');
            this.appendChild(this.labelEl);
        }

        setLabelTitle(value: string) {
            this.labelEl.getEl().setTitle(value);
        }

        setLabel(value: string, addTitle: boolean = true) {
            this.labelEl.setHtml(value);
            if (addTitle) {
                this.setLabelTitle(value);
            }
        }

        getLabel(): api.dom.AEl {
            return this.labelEl;
        }

        focus(): boolean {
            return this.labelEl.giveFocus();
        }
    }
}
