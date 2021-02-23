import {i18n} from '../../util/Messages';
import {AppHelper} from '../../util/AppHelper';
import {QueryField} from '../../query/QueryField';
import {TextInput, TextInputSize} from '../../ui/text/TextInput';
import {SpanEl} from '../../dom/SpanEl';
import {AutosizeTextInput} from '../../ui/text/AutosizeTextInput';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {StringHelper} from '../../util/StringHelper';
import {NamePrettyfier} from '../../NamePrettyfier';
import {DisplayNameGenerator} from './DisplayNameGenerator';
import {WizardHeader} from './WizardHeader';
import {Name} from '../../Name';
import {DivEl} from '../../dom/DivEl';
import {ElementHelper} from '../../dom/ElementHelper';
import {Element} from '../../dom/Element';

export interface WizardHeaderWithDisplayNameAndNameOptions {

    displayNameGenerator?: DisplayNameGenerator;

    displayNameLabel?: string;

}

export class WizardHeaderWithDisplayNameAndName
    extends WizardHeader {

    private forbiddenChars: RegExp = /[\/\\]+/ig;

    protected displayNameEl: TextInput;

    private displayNameProgrammaticallySet: boolean;

    protected options?: WizardHeaderWithDisplayNameAndNameOptions;

    protected pathEl: SpanEl;

    protected nameEl: TextInput;

    protected topRow: DivEl;

    protected bottomRow: DivEl;

    private autoGenerateName: boolean = false;

    private autoGenerationEnabled: boolean = true;

    private ignoreGenerateStatusForName: boolean = true;

    private simplifiedNameGeneration: boolean = false;

    constructor(options?: WizardHeaderWithDisplayNameAndNameOptions) {
        super();

        this.options = options;
        this.initElements();
        this.postInitElements();
        this.initListeners();
    }

    protected initElements() {
        this.displayNameProgrammaticallySet = !!this.options?.displayNameGenerator;

        this.topRow = new DivEl('wizard-header-top-row');
        this.bottomRow = new DivEl('wizard-header-bottom-row');
        this.displayNameEl = new TextInput('', TextInputSize.LARGE);

        this.pathEl = new SpanEl('path');
        this.pathEl.hide();

        this.nameEl = new WizardHeaderNameInput().setForbiddenCharsRe(this.forbiddenChars);
    }

    protected postInitElements() {
        const displayNamePlaceholder: string = !!this.options?.displayNameLabel ? this.options.displayNameLabel : i18n('field.displayName');
        this.displayNameEl.setPlaceholder(`<${displayNamePlaceholder}>`).setName(QueryField.DISPLAY_NAME);
        this.nameEl.setPlaceholder(`<${i18n('field.path')}>`).setName('name');
    }

    protected initListeners() {
        const debounceNotify = (query: string) => AppHelper.debounce((event: ValueChangedEvent) => {
            this.notifyPropertyChanged(query, event.getOldValue(), event.getNewValue());
        }, 100);

        this.displayNameEl.onValueChanged(debounceNotify(QueryField.DISPLAY_NAME));
        this.nameEl.onValueChanged(debounceNotify(`<${i18n('field.path')}>`));
        this.displayNameEl.onValueChanged((event: ValueChangedEvent) => {
            this.displayNameEl.removeClass('generated');
            const currentDisplayName: string = event.getNewValue() || '';

            if (this.options?.displayNameGenerator?.hasExpression()) {
                const generatedDisplayName: string = this.options.displayNameGenerator.execute() || '';

                this.displayNameProgrammaticallySet =
                    generatedDisplayName.toLowerCase() === currentDisplayName.toLowerCase() ||
                    generatedDisplayName.trim().toLowerCase() === currentDisplayName.toLowerCase() ||
                    StringHelper.isEmpty(currentDisplayName);

                if (this.displayNameProgrammaticallySet) {
                    this.displayNameEl.addClass('generated');
                }
            }
            this.doAutoGenerateName(currentDisplayName);
        });

        this.nameEl.onValueChanged((event: ValueChangedEvent) => {
            const currentName: string = event.getNewValue() || '';
            const displayName: string = this.getDisplayName() || '';

            this.autoGenerateName = this.checkAutoGenerateName(currentName, displayName);

            this.updateNameGeneratedStatus();
            // this.nameEl.getEl().setAttribute('size', '' + (event.getNewValue().length + 1));
        });
    }

    resetBaseValues() {
        this.displayNameEl.resetBaseValues();
    }

    // tslint:disable-next-line:max-line-length
    initNames(displayName: string, name: string, forceDisplayNameProgrammaticallySet: boolean, ignoreDirtyFlag: boolean = true, silent: boolean = false) {

        if (!ignoreDirtyFlag) {
            if (this.displayNameEl.isDirty()) {
                displayName = this.displayNameEl.getValue();
                name = this.nameEl.getValue();
            }
        }

        this.autoGenerateName = this.checkAutoGenerateName(name, displayName);

        this.displayNameEl.setValue(displayName, silent);
        if (name != null) {
            this.nameEl.setValue(name, silent);
        } else {
            this.nameEl.setValue(this.generateName(displayName));
        }

        if (this.options?.displayNameGenerator?.hasExpression()) {
            if (!forceDisplayNameProgrammaticallySet) {
                const generatedDisplayName: string = this.options.displayNameGenerator.execute();
                this.displayNameProgrammaticallySet = generatedDisplayName === displayName;
            } else {
                this.displayNameProgrammaticallySet = true;
            }
        }
    }

    isAutoGenerationEnabled(): boolean {
        return this.autoGenerationEnabled;
    }

    setAutoGenerationEnabled(value: boolean) {
        this.autoGenerationEnabled = value;
    }

    setDisplayName(value: string) {
        if (this.displayNameProgrammaticallySet) {
            value = value.trim();
            this.displayNameEl.setValue(value);
            this.doAutoGenerateName(value);
        }
    }

    setPath(value: string) {
        if (value) {
            this.pathEl.getEl().setText(value.replace(/\/$/, ''));
            this.pathEl.setTitle(value);
            this.pathEl.show();
        } else {
            this.pathEl.hide();
            this.pathEl.getEl().setText('');
        }

        this.pathEl.toggleClass('empty', StringHelper.isEmpty(this.pathEl.getEl().getText()));
    }

    setSimplifiedNameGeneration(value: boolean) {
        this.simplifiedNameGeneration = value;
    }

    toggleNameInput(enable: boolean) {
        this.nameEl.setEnabled(enable);
        this.toggleNameGeneration(enable);
    }

    toggleDisplayNameInput(enable: boolean) {
        if (enable) {
            this.displayNameEl.getEl().removeAttribute('disabled');
        } else {
            this.displayNameEl.getEl().setAttribute('disabled', 'disabled');
        }
    }

    getName(): string {
        return this.nameEl.getValue();
    }

    normalizeNames() {
        this.nameEl.updateValue();
        this.displayNameEl.updateValue();
    }

    getDisplayName(): string {
        return this.displayNameEl.getValue();
    }

    giveFocus(): boolean {
        return this.displayNameEl.giveFocus();
    }

    setAutoTrim(autoTrim: boolean) {
        this.nameEl.setAutoTrim(autoTrim);
        this.displayNameEl.setAutoTrim(autoTrim);
    }

    toggleNameGeneration(value: boolean) {
        this.setAutoGenerationEnabled(value);
        this.setIgnoreGenerateStatusForName(!value);
    }

    isValid(): boolean {
        return !!this.displayNameEl.getValue() && !!this.nameEl.getValue();
    }

    private checkAutoGenerateName(name: string, displayName: string): boolean {
        return StringHelper.isEmpty(name) ||
               displayName.toLowerCase() === name.toLowerCase() ||
               name.toLowerCase() === this.generateName(displayName).toLowerCase();
    }

    private doAutoGenerateName(value: string) {
        if (this.autoGenerateName && this.autoGenerationEnabled) {
            this.nameEl.setValue(this.generateName(value));
        }
    }

    private generateName(value: string): string {
        return this.ensureValidName(value);
    }

    private ensureValidName(possibleInvalidName: string): string {
        if (!possibleInvalidName) {
            return '';
        }
        let generated;
        if (this.simplifiedNameGeneration) {
            generated = possibleInvalidName.replace(Name.SIMPLIFIED_FORBIDDEN_CHARS, '').toLowerCase();
        } else {
            generated = NamePrettyfier.prettify(possibleInvalidName);
        }
        return (generated || '');
    }

    private setIgnoreGenerateStatusForName(value: boolean) {
        this.ignoreGenerateStatusForName = value;
        this.updateNameGeneratedStatus();
    }

    private updateNameGeneratedStatus() {
        if (this.autoGenerateName && !this.ignoreGenerateStatusForName) {
            this.nameEl.addClass('generated');
        } else {
            this.nameEl.removeClass('generated');
        }
    }

    setName(value: string) {
        this.nameEl.setValue(value);
    }

    toggleEnabled(enable: boolean) {
        super.toggleEnabled(enable);

        this.toggleNameInput(enable);
        this.toggleDisplayNameInput(enable);
    }

    /* TODO: DEPRECATE METHODS BELOW IN 4.0 */

    disableNameInput() {
        console.warn(`WizardHeaderWithDisplayNameAndName.disableNameInput() is deprecated and will be removed in lib-admin-ui 4.0.0`);
        this.toggleNameInput(false);
    }

    disableDisplayNameInput() {
        console.warn('WizardHeaderWithDisplayNameAndName.disableDisplayNameInput() ' +
                     'is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.toggleDisplayNameInput(false);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('wizard-header-with-display-name-and-name');

            const separator: SpanEl = new SpanEl('separator');
            separator.setHtml('/');

            this.topRow.appendChild(this.displayNameEl);
            this.bottomRow.appendChildren(this.pathEl, separator, this.nameEl);

            this.appendChild(this.topRow);
            this.appendChild(this.bottomRow);

            return rendered;
        });
    }
}

class WizardHeaderNameInput extends AutosizeTextInput {

    protected doUpdateSize() {
        const inputEl: ElementHelper = this.getEl();
        const cloneEl: ElementHelper = this.clone.getEl();
        const parent: Element = this.getParentElement();

        let spaceLeftForInput: number = parent.getEl().getWidthWithMargin();

        parent.getChildren().filter((c: Element) => c.isVisible() && !c.hasClass('autosize-attendant')).forEach((child: Element) => {
            if (child.hasClass('path') && !child.hasClass('empty')) {
                spaceLeftForInput -=  20; // min size of a static path element
            } else if (child !== this) {
                spaceLeftForInput -= child.getEl().getWidthWithMargin();
            }
        });

        const currentInputWidth: number = cloneEl.getWidthWithBorder();
        const min: number = Math.min(spaceLeftForInput, currentInputWidth);

        inputEl.getHTMLElement().style.flexBasis = `${min}px`;
    }
}
