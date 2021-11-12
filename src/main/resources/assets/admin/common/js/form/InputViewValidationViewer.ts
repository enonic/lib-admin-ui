import {Viewer} from '../ui/Viewer';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {i18n} from '../util/Messages';
import {AEl} from '../dom/AEl';

export class InputViewValidationViewer extends Viewer<InputValidationRecording> {

    constructor() {
        super('validation-viewer');
    }

    doLayout(recording: InputValidationRecording) {
        super.doLayout(recording);

        if (recording) {
            this.setHtml(this.getText());
        }
    }

    private getText(): string {
        const record: InputValidationRecording = this.getObject();

        if (record.isValid()) {
            return '';
        }

        const max: number = record.getOccurrences().getMaximum();

        if (record.isMinimumOccurrencesBreached()) {
            const min: number = record.getOccurrences().getMinimum();
            return (min >= 1 && max !== 1) ? i18n('field.occurrence.breaks.min', min) : i18n('field.value.required');
        }

        if (record.isMaximumOccurrencesBreached()) {
            return max > 1 ? i18n('field.occurrence.breaks.max.many', max) : i18n('field.occurrence.breaks.max.one');
        }

        return record.getErrorMessage();
    }
}
