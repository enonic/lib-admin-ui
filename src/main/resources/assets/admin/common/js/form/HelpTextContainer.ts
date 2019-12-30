import {DivEl} from '../dom/DivEl';
import {PEl} from '../dom/PEl';

export class HelpTextContainer {

    private helpTextDiv: DivEl;

    private helpTextToggler: DivEl;

    private toggleListeners: { (show: boolean): void }[] = [];

    constructor(value: string) {
        this.helpTextToggler = new DivEl('help-text-toggler');
        this.helpTextToggler.setHtml('?');

        this.helpTextDiv = new DivEl('help-text');

        let pEl = new PEl();
        pEl.getEl().setText(value);

        this.helpTextDiv.appendChild(pEl);

        this.helpTextToggler.onClicked((event: MouseEvent) => {
            this.helpTextDiv.toggleClass('visible');
            this.helpTextToggler.toggleClass('on');
            this.notifyHelpTextToggled(this.helpTextDiv.hasClass('visible'));
            event.stopPropagation();
        });
    }

    toggleHelpText(show?: boolean) {
        this.helpTextDiv.toggleClass('visible', show);
        this.helpTextToggler.toggleClass('on', show);
    }

    getToggler(): DivEl {
        return this.helpTextToggler;
    }

    getHelpText(): DivEl {
        return this.helpTextDiv;
    }

    onHelpTextToggled(listener: (show: boolean) => void) {
        this.toggleListeners.push(listener);
    }

    unHelpTextToggled(listener: (show: boolean) => void) {
        this.toggleListeners = this.toggleListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyHelpTextToggled(show: boolean) {
        this.toggleListeners.forEach(listener => listener(show));
    }
}
