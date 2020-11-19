import {i18n} from '../../util/Messages';
import {AppHelper} from '../../util/AppHelper';
import {QueryField} from '../../query/QueryField';
import {TextInput} from '../../ui/text/TextInput';
import {SpanEl} from '../../dom/SpanEl';
import {AutosizeTextInput} from '../../ui/text/AutosizeTextInput';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {StringHelper} from '../../util/StringHelper';
import {WindowDOM} from '../../dom/WindowDOM';
import {NamePrettyfier} from '../../NamePrettyfier';
import {DisplayNameGenerator} from './DisplayNameGenerator';
import {WizardHeader} from './WizardHeader';
import {Name} from '../../Name';

export class WizardHeaderWithDisplayNameAndNameBuilder {

    displayNameGenerator: DisplayNameGenerator;

    displayNameLabel: string;

    setDisplayNameGenerator(value: DisplayNameGenerator): WizardHeaderWithDisplayNameAndNameBuilder {
        this.displayNameGenerator = value;
        return this;
    }

    setDisplayNameLabel(value: string): WizardHeaderWithDisplayNameAndNameBuilder {
        this.displayNameLabel = value;
        return this;
    }

    build(): WizardHeaderWithDisplayNameAndName {
        return new WizardHeaderWithDisplayNameAndName(this);
    }

}

export class WizardHeaderWithDisplayNameAndName
    extends WizardHeader {

    private displayNameGenerator: DisplayNameGenerator;

    private forbiddenChars: RegExp = /[\/\\]+/ig;

    protected displayNameEl: TextInput;

    private displayNameProgrammaticallySet: boolean;

    protected pathEl: SpanEl;

    protected nameEl: TextInput;

    private autoGenerateName: boolean = false;

    private autoGenerationEnabled: boolean = true;

    private ignoreGenerateStatusForName: boolean = true;

    private simplifiedNameGeneration: boolean = false;

    constructor(builder: WizardHeaderWithDisplayNameAndNameBuilder) {
        super();
        this.addClass('wizard-header-with-display-name-and-name');
        this.displayNameGenerator = builder.displayNameGenerator;
        this.displayNameProgrammaticallySet = this.displayNameGenerator != null;

        const debounceNotify = (query: string) => AppHelper.debounce((event: ValueChangedEvent) => {
            this.notifyPropertyChanged(query, event.getOldValue(), event.getNewValue());
        }, 100);

        this.displayNameEl = AutosizeTextInput.large();
        this.displayNameEl.setPlaceholder(
            '<' + (builder.displayNameLabel ? builder.displayNameLabel : i18n('field.displayName')) + '>').setName(
            QueryField.DISPLAY_NAME);
        this.displayNameEl.onValueChanged(debounceNotify(QueryField.DISPLAY_NAME));
        this.appendChild(this.displayNameEl);

        this.pathEl = new SpanEl('path');
        this.pathEl.hide();
        this.appendChild(this.pathEl);

        this.nameEl = AutosizeTextInput.middle().setForbiddenCharsRe(this.forbiddenChars);
        this.nameEl.setPlaceholder('<' + i18n('field.path') + '>').setName('name');
        this.nameEl.onValueChanged(debounceNotify(`<${i18n('field.path')}>`));

        this.appendChild(this.nameEl);

        this.displayNameEl.onValueChanged((event: ValueChangedEvent) => {

            this.displayNameEl.removeClass('generated');

            let currentDisplayName = event.getNewValue() || '';

            if (this.displayNameGenerator && this.displayNameGenerator.hasExpression()) {
                let generatedDisplayName = this.displayNameGenerator.execute() || '';

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
            let currentName = event.getNewValue() || '';
            let displayName = this.getDisplayName() || '';

            this.autoGenerateName = this.checkAutoGenerateName(currentName, displayName);

            this.updateNameGeneratedStatus();
        });

        this.onShown(() => this.updatePathAndNameWidth());
        WindowDOM.get().onResized(() => this.updatePathAndNameWidth(), this);

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

        if (this.displayNameGenerator && this.displayNameGenerator.hasExpression()) {
            if (!forceDisplayNameProgrammaticallySet) {
                let generatedDisplayName = this.displayNameGenerator.execute();
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
        this.pathEl.getEl().setText(value);
        if (value) {
            this.pathEl.show();
        } else {
            this.pathEl.hide();
        }
    }

    setSimplifiedNameGeneration(value: boolean) {
        this.simplifiedNameGeneration = value;
    }

    toggleNameInput(enable: boolean) {
        if (enable) {
            this.nameEl.getEl().removeAttribute('disabled');
        } else {
            this.nameEl.getEl().setAttribute('disabled', 'disabled');
        }
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

    private updatePathAndNameWidth() {
        let pathEl = this.pathEl.getEl();
        let nameEl = this.nameEl.getEl();
        let headerWidth = this.getEl().getWidth();
        let pathWidth = pathEl.getWidthWithMargin();
        let nameWidth = nameEl.getWidthWithMargin();
        let nameMinWidth = nameEl.getMinWidth();

        if (pathWidth + nameWidth > headerWidth) {
            if (nameWidth > nameMinWidth) {
                nameEl.setWidthPx(Math.max(nameMinWidth, headerWidth - pathWidth));
            }
            if (pathWidth + nameMinWidth > headerWidth) {
                pathEl.setWidthPx(headerWidth - nameMinWidth - pathEl.getMarginLeft() - pathEl.getMarginRight());
            }
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
}
