import {FormItemSetOccurrenceView} from './FormItemSetOccurrenceView';
import {FormSetOccurrences} from '../FormSetOccurrences';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {RemoveButtonClickedEvent} from '../../RemoveButtonClickedEvent';

/*
 * A kind of a controller, which adds/removes FormItemSetOccurrenceView-s
 */
export class FormItemSetOccurrences
    extends FormSetOccurrences<FormItemSetOccurrenceView> {

    createNewOccurrenceView(occurrence: FormSetOccurrence<FormItemSetOccurrenceView>): FormItemSetOccurrenceView {

        const newOccurrenceView = new FormItemSetOccurrenceView(this.getNewOccurrenceConfig(occurrence));

        newOccurrenceView.onRemoveButtonClicked((event: RemoveButtonClickedEvent<FormItemSetOccurrenceView>) => {
            this.removeOccurrenceView(event.getView());
        });

        return newOccurrenceView;
    }
}
