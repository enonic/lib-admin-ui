import {Viewer} from '../ui/Viewer';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {i18n} from '../util/Messages';

export class InputViewValidationViewer extends Viewer<InputValidationRecording> {

    constructor() {
        super('validation-viewer');
    }

    doLayout(object: InputValidationRecording) {
        super.doLayout(object);

        if (object) {
            this.setVisible(!object.isValid());
            this.setHtml(this.getText());
        }
    }

    private getText(): string {
        const record: InputValidationRecording = this.getObject();

        if (record.isValid()) {
            return '';
        }

        if (record.isMinimumOccurrencesBreached()) {
            const min: number = record.getOccurrences().getMinimum();
            return min > 1 ? i18n('field.occurrence.breaks.min', min) : i18n('field.value.required');
        }

        const max: number = record.getOccurrences().getMaximum();
        return max > 1 ? i18n('field.occurrence.breaks.max.many', max) : i18n('field.occurrence.breaks.max.one');
    }
}
