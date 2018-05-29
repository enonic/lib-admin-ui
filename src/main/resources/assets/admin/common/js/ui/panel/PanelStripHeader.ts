module api.ui.panel {

    import SpanEl = api.dom.SpanEl;
    import DivEl = api.dom.DivEl;
    import i18n = api.util.i18n;

    export class PanelStripHeader
        extends DivEl {

        private text: SpanEl;

        private toggler: DivEl;

        private tooltip: Tooltip;

        private enableChangedListeners: { (value: boolean): void }[] = [];

        constructor(text: string, isTogglerAllowed: boolean = false) {
            super();
            this.addClass('panel-strip-panel-header');
            this.text = new SpanEl().setHtml(text);

            if (isTogglerAllowed) {
                this.toggler = new DivEl('x-data-toggler');

                this.toggler.onClicked((e) => this.toggleState(e));
                this.onClicked((e) => this.hasClass('enabled') || this.toggleState(e));
                this.tooltip = new Tooltip(this.toggler, '', 200).setMode(Tooltip.MODE_GLOBAL_STATIC);

                this.setTogglerState(false);
            }

        }

        private toggleState(event: MouseEvent) {
            this.setTogglerState(!this.hasClass('enabled'));
            event.stopPropagation();
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

            this.toggleClass('enabled', enabled);
            this.toggleClass('disabled', !enabled);

            this.tooltip.setText(i18n(enabled ? 'tooltip.xdata.disable' : 'tooltip.xdata.enable'));

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
