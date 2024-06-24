import {H5El} from '../../dom/H5El';
import {HelpTextContainer} from '../HelpTextContainer';
import {DivEl} from '../../dom/DivEl';
import {SpanEl} from '../../dom/SpanEl';
import {FormSet} from './FormSet';

export class FormSetHeader
    extends DivEl {
    private helpTextContainer: HelpTextContainer;
    private title: H5El;

    constructor(formSet: FormSet, forceHelpToggle?: boolean) {
        super('form-set-header');
        this.title = new H5El();
        this.title.setHtml(formSet.getLabel() || '');
        if (formSet.getOccurrences().required()) {
            const requiredMarker = new SpanEl('required');
            this.title.appendChild(requiredMarker);
        }
        if (formSet.getHelpText() || forceHelpToggle) {
            this.helpTextContainer = new HelpTextContainer(formSet.getHelpText());
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.appendChild(this.title);
            if (this.helpTextContainer) {
                const helpTextDiv = this.helpTextContainer.getHelpText();
                if (helpTextDiv) {
                    this.appendChild(helpTextDiv);
                }
            }
            return rendered;
        });
    }

    public onHelpTextToggled(listener: (show: boolean) => void): void {
        this.helpTextContainer?.onHelpTextToggled(listener);
    }

    toggleHelpText(show?: boolean): void {
        this.helpTextContainer?.toggleHelpText(show);
    }
}
