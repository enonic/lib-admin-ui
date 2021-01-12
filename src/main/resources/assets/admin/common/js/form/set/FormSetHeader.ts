import {H5El} from '../../dom/H5El';
import {HelpTextContainer} from '../HelpTextContainer';
import {DivEl} from '../../dom/DivEl';

export class FormSetHeader
    extends DivEl {
    private helpTextContainer: HelpTextContainer;
    private title: H5El;

    constructor(text?: string, helpText?: string, forceHelpToggle?: boolean) {
        super('form-set-header');
        this.title = new H5El();
        this.title.setHtml(text || '');
        if (helpText || forceHelpToggle) {
            this.helpTextContainer = new HelpTextContainer(helpText);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.appendChild(this.title);
            if (this.helpTextContainer) {
                this.prependChild(this.helpTextContainer.getToggler());
                const helpTextDiv = this.helpTextContainer.getHelpText();
                if (helpTextDiv) {
                    this.appendChild(helpTextDiv);
                }
            }
            return rendered;
        });
    }

    public onHelpTextToggled(listener: (show: boolean) => void) {
        if (this.helpTextContainer) {
            this.helpTextContainer.onHelpTextToggled(listener);
        }
    }
}
