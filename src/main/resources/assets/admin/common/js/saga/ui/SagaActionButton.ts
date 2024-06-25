import {Button} from '../../ui/button/Button';
import {i18n} from '../../util/Messages';
import {EnonicAiOpenDialogEvent} from '../event/EnonicAiOpenDialogEvent';

export class SagaActionButton extends Button {

    private dataPath?: string;

    constructor() {
        super();

        this.setTitle(i18n('action.saga')).addClass('icon-saga icon-sparkling');

        this.initListeners();
    }

    setDataPath(dataPath: string): SagaActionButton {
        this.dataPath = dataPath;
        return this;
    }

    protected initListeners(): void {
        this.onClicked(() => {
            if (this.dataPath) {
                new EnonicAiOpenDialogEvent(this.dataPath).fire();
            }
        });
    }
}
