import {ClassHelper} from '../../ClassHelper';
import {Event} from '../../event/Event';

export class AiContentOperatorSetContextEvent
    extends Event {

    private readonly sourceDataPath: string;

    constructor(dataPath: string) {
        super();

        this.sourceDataPath = dataPath;
    }

    getSourceDataPath(): string {
        return this.sourceDataPath;
    }

    static on(handler: (event: AiContentOperatorSetContextEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiContentOperatorSetContextEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
