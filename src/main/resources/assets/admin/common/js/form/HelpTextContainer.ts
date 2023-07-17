import {DivEl} from '../dom/DivEl';
import {PEl} from '../dom/PEl';
import {i18n} from '../util/Messages';
import {StringHelper} from '../util/StringHelper';

export class HelpTextContainer {

    private helpTextDiv?: DivEl;

    private helpTextToggler: DivEl;

    private toggleListeners: ((show: boolean) => void)[] = [];

    constructor(value: string) {
        this.initHelpTextToggler();
        this.initHelpTextDiv(value);
    }

    private initHelpTextToggler(): void {
        this.helpTextToggler = new DivEl('help-text-toggler');
        this.helpTextToggler.setHtml('?').setTitle(i18n('tooltip.helptext.show'));

        this.helpTextToggler.onClicked((event: MouseEvent) => {
            const isOn: boolean = this.helpTextToggler.hasClass('on');

            this.toggleHelpText(!isOn);
            this.notifyHelpTextToggled(!isOn);
            event.stopPropagation();
        });
    }

    private initHelpTextDiv(value: string): void {
        if (!StringHelper.isBlank(value)) {
            this.helpTextDiv = new DivEl('help-text');

            const pEl: PEl = new PEl();
            pEl.getEl().setText(value);

            this.helpTextDiv.appendChild(pEl);
        }
    }

    toggleHelpText(show?: boolean): void {
        this.helpTextDiv?.toggleClass('visible', show);
        this.helpTextToggler.toggleClass('on', show);
        this.helpTextToggler.setTitle(show ? i18n('tooltip.helptext.hide') : i18n('tooltip.helptext.show'));
    }

    getToggler(): DivEl {
        return this.helpTextToggler;
    }

    getHelpText(): DivEl {
        return this.helpTextDiv;
    }

    onHelpTextToggled(listener: (show: boolean) => void): void {
        this.toggleListeners.push(listener);
    }

    unHelpTextToggled(listener: (show: boolean) => void): void {
        this.toggleListeners = this.toggleListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyHelpTextToggled(show: boolean): void {
        this.toggleListeners.forEach(listener => listener(show));
    }
}
