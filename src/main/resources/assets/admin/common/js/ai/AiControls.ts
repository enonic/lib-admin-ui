import * as Q from 'q';
import {DivEl} from '../dom/DivEl';
import {Button} from '../ui/button/Button';
import {i18n} from '../util/Messages';
import {AiHelperState} from './AiHelperState';
import {AiContentOperatorOpenDialogEvent} from './event/AiContentOperatorOpenDialogEvent';

interface AiControlsConfig {
    showAiButton?: boolean;
}

export class AiControls
    extends DivEl {

    private dataPath?: string;

    private button?: Button;

    private loader: DivEl;

    constructor(config: AiControlsConfig = {}) {
        super();

        this.initElements(config);
        this.initListeners();
    }

    setState(state: AiHelperState): this {
        this.setClass(`ai-controls ${state}`);

        return this;
    }

    setDataPath(dataPath: string): AiControls {
        this.dataPath = dataPath;
        return this;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.appendChild(this.loader);
            if (this.button) {
                this.appendChild(this.button);
            }

            return rendered;
        });
    }

    protected initElements(config: AiControlsConfig): void {
        this.loader = new DivEl(`ai-controls-loader`);

        if (config.showAiButton) {
            this.button = new Button();
            this.button.addClass('ai-controls-button');
            this.button.setTitle(i18n('ai.action.contentOperator.use'));
        }


        this.setState(AiHelperState.DEFAULT);
    }

    protected initListeners(): void {
        this.button?.onClicked(() => {
            if (this.dataPath) {
                new AiContentOperatorOpenDialogEvent(this.dataPath).fire();
            }
        });
    }
}
