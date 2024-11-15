import {DivEl} from '../dom/DivEl';
import {AiHelperState} from './AiHelperState';

export class AiStateControl
    extends DivEl {

    constructor() {
        super();

        this.setState(AiHelperState.DEFAULT);
    }

    setState(state: AiHelperState): this {
        this.setClass(`ai-state-control ${state}`);

        return this;
    }

}
