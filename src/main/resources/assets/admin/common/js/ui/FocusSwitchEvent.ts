import {InputTypeView} from '../form/inputtype/InputTypeView';
import {Event} from '../event/Event';
import {ClassHelper} from '../ClassHelper';

export class FocusSwitchEvent
    extends Event {
    private inputTypeView: InputTypeView;

    constructor(inputTypeView: InputTypeView) {
        super();
        this.inputTypeView = inputTypeView;
    }

    static on(handler: (event: FocusSwitchEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: FocusSwitchEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    getInputTypeView(): InputTypeView {
        return this.inputTypeView;
    }
}
