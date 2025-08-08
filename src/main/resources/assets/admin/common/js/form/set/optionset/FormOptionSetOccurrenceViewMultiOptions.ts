import Q from 'q';
import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';

export class FormOptionSetOccurrenceViewMultiOptions
    extends FormOptionSetOccurrenceView {

    layout(validate: boolean = true): Q.Promise<void> {
        return super.layout(validate).then(rendered => {
            this.addClass('multi-selection');

            return rendered;
        });
    }

}
