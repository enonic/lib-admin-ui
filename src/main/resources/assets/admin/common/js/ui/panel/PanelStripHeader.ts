import * as Q from 'q';
import {SpanEl} from '../../dom/SpanEl';
import {DivEl} from '../../dom/DivEl';

export interface PanelStripHeaderOptions {
    text: string;
}

export class PanelStripHeader
    extends DivEl {

    protected readonly options: PanelStripHeaderOptions;

    protected textEl: SpanEl;

    constructor(options: PanelStripHeaderOptions) {
        super();

        this.options = options;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.textEl = new SpanEl().setHtml(this.options.text);
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
