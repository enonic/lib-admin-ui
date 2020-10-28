import {FormOptionSetOccurrenceView} from './FormOptionSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {RemoveButtonClickedEvent} from '../../RemoveButtonClickedEvent';

export class FormOptionSetOccurrences
    extends FormSetOccurrences<FormOptionSetOccurrenceView> {

    createNewOccurrenceView(occurrence: FormSetOccurrence<FormOptionSetOccurrenceView>): FormOptionSetOccurrenceView {

        const newOccurrenceView = new FormOptionSetOccurrenceView(this.getNewOccurrenceConfig(occurrence));

        newOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<FormOptionSetOccurrenceView>) => {
            this.removeOccurrenceView(event.getView());
        });
        return newOccurrenceView;
    }
}
