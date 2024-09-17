import * as Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Button} from '../../ui/button/Button';
import {i18n} from '../../util/Messages';
import {AiHelperState} from '../AiHelperState';
import {EnonicAiOpenDialogEvent} from '../event/EnonicAiOpenDialogEvent';

export class AiActionButton
    extends DivEl {

    private static baseClass = 'ai-button-container';

    private dataPath?: string;

    private button: Button;

    private loader: DivEl;

    constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.button = new Button().addClass(`${AiActionButton.baseClass}-icon icon-ai`) as Button;
        this.loader = new DivEl(`${AiActionButton.baseClass}-loader`);
        this.setTitle(i18n('action.saga'));
        this.setState(AiHelperState.DEFAULT);
    }

    setState(state: AiHelperState): this {
        this.setClass(`${AiActionButton.baseClass} ${state}`);

        return this;
    }

    setDataPath(dataPath: string): AiActionButton {
        this.dataPath = dataPath;
        return this;
    }

    getDataPath(): string {
        return this.dataPath;
    }

    protected initListeners(): void {
        this.button.onClicked(() => {
            if (this.dataPath) {
                new EnonicAiOpenDialogEvent(this.dataPath).fire();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.loader, this.button);

            return rendered;
        });
    }
}
