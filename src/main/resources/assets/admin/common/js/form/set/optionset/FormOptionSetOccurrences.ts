import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormSetOccurrence} from '../FormSetOccurrence';

export class FormOptionSetOccurrences
    extends FormSetOccurrences<FormOptionSetOccurrenceView> {

    protected createOccurrenceView(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>): FormOptionSetOccurrenceView {
        return new FormOptionSetOccurrenceView(config);
    }

    createAndAddOccurrence(insertAtIndex: number = this.countOccurrences(),
                           validate: boolean = true): Q.Promise<FormOptionSetOccurrenceView> {
        return super.createAndAddOccurrence(insertAtIndex, validate).then((formOptionSetOccurrenceView: FormOptionSetOccurrenceView) => {
            formOptionSetOccurrenceView?.selectDefaultOption();

            return formOptionSetOccurrenceView;
        });
    }

    protected addOccurrence(occurrence: FormSetOccurrence<FormOptionSetOccurrenceView>,
                            validate: boolean = true): Q.Promise<FormOptionSetOccurrenceView> {
        return super.addOccurrence(occurrence, validate).then((formOptionSetOccurrenceView: FormOptionSetOccurrenceView) => {
            if (this.context?.getFormState().isNew()) {
                formOptionSetOccurrenceView?.selectDefaultOption();
            }

            return formOptionSetOccurrenceView;
        });
    }
}
