import * as Q from 'q';
import {SpanEl} from '../../dom/SpanEl';
import {DivEl} from '../../dom/DivEl';

export interface PanelStripHeaderConfig {
    text: string;
}

export class PanelStripHeader
    extends DivEl {

    protected readonly config: PanelStripHeaderConfig;

    protected textEl: SpanEl;

    constructor(config: PanelStripHeaderConfig) {
        super();

        this.config = config;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.textEl = new SpanEl().setHtml(this.config.text);
    }

    protected initListeners(): void {
        //
    }

    doRender(): Q.Promise<boolean> {
        this.addClass('panel-strip-panel-header');
        this.appendChild(this.textEl);

        return Q(true);
    }

}
