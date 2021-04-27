import {i18n} from '../util/Messages';
import {Viewer} from '../ui/Viewer';
import {UlEl} from '../dom/UlEl';
import {LiEl} from '../dom/LiEl';
import {ValidationRecording} from './ValidationRecording';
import {ValidationRecordingPath} from './ValidationRecordingPath';

export class ValidationRecordingViewer
    extends Viewer<ValidationRecording> {

    private readonly list: UlEl;

    constructor() {
        super('validation-viewer');
        this.list = new UlEl();
    }

    doLayout(object: ValidationRecording) {
        super.doLayout(object);

        if (!this.list.isRendered()) {
            this.appendChild(this.list);
        } else {
            this.list.removeChildren();
        }

        if (object && this.list.getChildren().length === 0) {
            object.getBreakMinimumOccurrences().forEach((path: ValidationRecordingPath) => {
                this.list.appendChild(this.createItemView(path, true));
            });
            object.getBreakMaximumOccurrences().forEach((path: ValidationRecordingPath) => {
                this.list.appendChild(this.createItemView(path, false));
            });
        }
    }

    setError(text: string) {
        this.list.removeChildren();
        if (text) {
            this.list.appendChild(new LiEl().setHtml(text));
        }
    }

    private createItemView(path: ValidationRecordingPath, breaksMin: boolean): LiEl {
        let text = breaksMin ? this.resolveMinText(path) : this.resolveMaxText(path);
        return new LiEl().setHtml(text);
    }

    private resolveMinText(path: ValidationRecordingPath): string {
        return path.getMin() > 1 ? i18n('field.occurrence.breaks.min', path.getMin()) : i18n('field.value.required');
    }

    private resolveMaxText(path: ValidationRecordingPath): string {
        return path.getMax() > 1 ? i18n('field.occurrence.breaks.max.many', path.getMax()) : i18n('field.occurrence.breaks.max.one');
    }

}
