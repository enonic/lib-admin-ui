import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import * as Q from 'q';

export class FormOptionSetOccurrenceViewMultiOptions
    extends FormOptionSetOccurrenceView {

    layout(validate: boolean = true): Q.Promise<void> {
        return super.layout(validate).then(rendered => {
            this.addClass('multi-selection');

            return rendered;
        });
    }

}
