import {i18n} from '../../../util/Messages';
import {AEl} from '../../../dom/AEl';

export class ClearFilterButton
    extends AEl {

    constructor() {
        super('clear-filter-button');
        this.getEl().setInnerHtml(i18n('panel.filter.clear'));
        this.getHTMLElement().setAttribute('href', 'javascript:;');
        this.hide();
    }
}
