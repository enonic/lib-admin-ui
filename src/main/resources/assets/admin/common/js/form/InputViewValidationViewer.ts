import {Viewer} from '../ui/Viewer';
import {InputValidationRecording} from './inputtype/InputValidationRecording';
import {i18n} from '../util/Messages';
import {AEl} from '../dom/AEl';

export class InputViewValidationViewer extends Viewer<InputValidationRecording> {

    private static ERROR_DETAILS_VISIBLE_CLS: string = 'error-details-visible';
    private static ERROR_DETAILS_TOGGLER_CLS: string = 'error-details-toggler';

    constructor() {
        super('validation-viewer');
    }

    doLayout(recording: InputValidationRecording) {
        super.doLayout(recording);

        if (recording) {
            this.setHtml(recording.isValidationMessageToBeRendered() ? this.getText() : '');
            if (recording.isValidationMessageToBeRendered() && recording.hasToggleErrorDetailsCallback()) {
                this.appendErrorDetailsToggler(recording, this.hasClass(InputViewValidationViewer.ERROR_DETAILS_VISIBLE_CLS));
            }
        }
    }

    private appendErrorDetailsToggler(recording: InputValidationRecording, isErrorDetailsVisible: boolean) {
        const toggleLink = new AEl(InputViewValidationViewer.ERROR_DETAILS_TOGGLER_CLS);

        toggleLink.whenRendered(() =>
            toggleLink.setHtml(
        isErrorDetailsVisible ? i18n('field.validation.hideDetails') : i18n('field.validation.showDetails')
            )
        );

        toggleLink.onClicked((e: MouseEvent) => {
            const errorDetailsVisible = this.hasClass(InputViewValidationViewer.ERROR_DETAILS_VISIBLE_CLS);
            this.toggleClass(InputViewValidationViewer.ERROR_DETAILS_VISIBLE_CLS, !errorDetailsVisible);
            toggleLink.setHtml(errorDetailsVisible ?
                i18n('field.validation.showDetails') : i18n('field.validation.hideDetails')
            );
            recording.getToggleErrorDetailsCallback()();

            e.stopPropagation();
            e.preventDefault();
        });

        this.appendChild(toggleLink);
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
