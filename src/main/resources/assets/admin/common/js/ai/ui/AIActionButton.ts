import {Button} from '../../ui/button/Button';
import {i18n} from '../../util/Messages';
import {EnonicAiOpenDialogEvent} from '../event/EnonicAiOpenDialogEvent';

export class AIActionButton
    extends Button {

    public static iconClass = 'icon-ai';

    private dataPath?: string;

    constructor() {
        super();

        this.setTitle(i18n('action.saga')).addClass('icon-sparkling').addClass(AIActionButton.iconClass);

        this.initListeners();
    }

    setDataPath(dataPath: string): AIActionButton {
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
