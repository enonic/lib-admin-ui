module api.ui.panel {

    import SpanEl = api.dom.SpanEl;
    import DivEl = api.dom.DivEl;

    export class PanelStripHeader
        extends DivEl {

        private text: SpanEl;

        private toggler: DivEl;

        private enableChangedListeners: { (value: boolean): void }[] = [];

        constructor(text: string, isTogglerEnabled: boolean = false) {
            super();
            this.addClass('panel-strip-panel-header');
            this.text = new SpanEl().setHtml(text);

            if (isTogglerEnabled) {
                this.toggler = new DivEl('toggler');

                this.toggler.onClicked(() => {
                    this.setTogglerState(!this.hasClass('enabled'));
                });

                this.setTogglerState(false);
            }

        }

        doRender(): wemQ.Promise<boolean> {

            this.appendChild(this.text);

            if (this.toggler) {
                this.appendChild(this.toggler);
            }

            return wemQ(true);
        }

        setTogglerState(enabled: boolean, silent: boolean = false) {

            if (!this.toggler) {
                return;
            }
            let changed: boolean = false;
            if (this.hasClass('enabled') != enabled) {
                changed = true;
            }

            /* if (enabled) {
                 this.toggler.setHtml("-");
             } else {
                 this.toggler.setHtml("+");
             }*/
            this.toggleClass('enabled', enabled);
            this.toggleClass('disabled', !enabled);

            if (changed && !silent) {
                this.notifyEnableChanged(enabled);
            }
        }

        onEnableChanged(listener: (value: boolean) => void) {
            this.enableChangedListeners.push(listener);
        }

        unEnableChanged(listener: (value: boolean) => void) {
            this.enableChangedListeners = this.enableChangedListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        private notifyEnableChanged(value: boolean) {
            this.enableChangedListeners.forEach((listener) => {
                listener(value);
            });
        }
    }
}
