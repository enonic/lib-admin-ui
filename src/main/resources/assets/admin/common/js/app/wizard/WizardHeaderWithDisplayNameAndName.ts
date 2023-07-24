import {i18n} from '../../util/Messages';
import {AppHelper} from '../../util/AppHelper';
import {QueryField} from '../../query/QueryField';
import {TextInput, TextInputSize} from '../../ui/text/TextInput';
import {SpanEl} from '../../dom/SpanEl';
import {AutosizeTextInput} from '../../ui/text/AutosizeTextInput';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {StringHelper} from '../../util/StringHelper';
import {NamePrettyfier} from '../../NamePrettyfier';
import {WizardHeader} from './WizardHeader';
import {Name} from '../../Name';
import {DivEl} from '../../dom/DivEl';
import {ElementHelper} from '../../dom/ElementHelper';
import {Element, LangDirection} from '../../dom/Element';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {Property, PropertyBuilder} from '../../data/Property';

export class WizardHeaderWithDisplayNameAndName
    extends WizardHeader {

    private static GENERATED_CLASS: string = 'generated';

    private forbiddenChars: RegExp = /[\/\\]+/ig;

    protected displayNameEl: TextInput;

    protected pathEl: SpanEl;

    protected nameEl: TextInput;

    protected topRow: DivEl;

    protected bottomRow: DivEl;

    private autoGenerationEnabled: boolean = true;

    private ignoreGenerateStatusForName: boolean = true;

    private simplifiedNameGeneration: boolean = false;

    constructor() {
        super();

        this.initElements();
        this.postInitElements();
    }

    protected initElements() {
        this.topRow = new DivEl('wizard-header-top-row');
        this.bottomRow = new DivEl('wizard-header-bottom-row');
        this.displayNameEl = new TextInput('', TextInputSize.LARGE);

        this.pathEl = new SpanEl('path');
        this.pathEl.hide();

        this.nameEl = new WizardHeaderNameInput().setForbiddenCharsRe(this.forbiddenChars);
    }

    protected postInitElements() {
        this.setPlaceholder(i18n('field.displayName'));
        this.nameEl.setPlaceholder(`<${i18n('field.path')}>`).setName('name');
    }

    protected initListeners() {
        ResponsiveManager.onAvailableSizeChanged(this);

        const debounceNotifyValueChanged = (propertyName: string) => AppHelper.debounce((event: ValueChangedEvent) => {
            const valueProperty = Property.create().setName(propertyName).build();
            this.notifyPropertyChanged(valueProperty, event.getOldValue(), event.getNewValue());
        }, 100);

        this.displayNameEl.onValueChanged(debounceNotifyValueChanged(QueryField.DISPLAY_NAME));
        this.nameEl.onValueChanged(debounceNotifyValueChanged(`<${i18n('field.path')}>`));
        this.displayNameEl.onValueChanged((event: ValueChangedEvent) => {
            this.displayNameEl.removeClass(WizardHeaderWithDisplayNameAndName.GENERATED_CLASS);

            const currentDisplayName: string = event.getNewValue() || '';

            if (this.autoGenerationEnabled && this.isNameEmptyOrEqualDisplayName(event.getOldValue())) {
                this.nameEl.setValue(this.generateName(currentDisplayName), false, true);
                this.nameEl.toggleClass(WizardHeaderWithDisplayNameAndName.GENERATED_CLASS, !this.ignoreGenerateStatusForName);
            }
        });

        this.nameEl.onValueChanged(() => {
            this.nameEl.removeClass(WizardHeaderWithDisplayNameAndName.GENERATED_CLASS);
        });
    }

    setPlaceholder(value: string) {
        if (value) {
            this.displayNameEl.setPlaceholder(`<${value}>`).setName(QueryField.DISPLAY_NAME);
        }
    }

    resetBaseValues() {
        this.displayNameEl.resetBaseValues();
        this.nameEl.resetBaseValues();
    }

    isAutoGenerationEnabled(): boolean {
        return this.autoGenerationEnabled;
    }

    setAutoGenerationEnabled(value: boolean) {
        this.autoGenerationEnabled = value;
    }

    setDisplayName(value: string, silent?: boolean): void {
        this.displayNameEl.setValue(value.trim(), silent);
    }

    setGeneratedDisplayName(value: string, silent?: boolean): void {
        this.setDisplayName(value, silent);
        this.displayNameEl.toggleClass(WizardHeaderWithDisplayNameAndName.GENERATED_CLASS, true);
    }

    setDir(value: LangDirection): Element {
        this.displayNameEl.setDir(value);
        this.nameEl.setDir(value);
        return this;
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

    private isNameEmptyOrEqualDisplayName(displayName: string): boolean {
        const name: string = this.nameEl.getValue();

        return StringHelper.isEmpty(name) ||
               displayName.toLowerCase() === name.toLowerCase() ||
               name.toLowerCase() === this.generateName(displayName).toLowerCase();
    }

    private generateName(value: string): string {
        return this.ensureValidName(value);
    }

    private ensureValidName(possibleInvalidName: string): string {
        if (!possibleInvalidName) {
            return '';
        }

        const generated: string = this.simplifiedNameGeneration ?
                                  possibleInvalidName.replace(Name.SIMPLIFIED_FORBIDDEN_CHARS, '').toLowerCase() :
                                  NamePrettyfier.prettify(possibleInvalidName);
        return (generated || '');
    }

    private setIgnoreGenerateStatusForName(value: boolean) {
        this.ignoreGenerateStatusForName = value;
        this.nameEl.toggleClass(WizardHeaderWithDisplayNameAndName.GENERATED_CLASS,
            !this.ignoreGenerateStatusForName && this.isNameEmptyOrEqualDisplayName(this.displayNameEl.getValue()));
    }

    setName(value: string, silent?: boolean): void {
        this.nameEl.setValue(value, silent);
    }

    toggleEnabled(enable: boolean) {
        super.toggleEnabled(enable);

        this.toggleNameInput(enable);
        this.toggleDisplayNameInput(enable);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {

            this.initListeners();
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

    /* TODO: DEPRECATE METHODS BELOW IN 4.0 */

    disableNameInput() {
        console.warn('WizardHeaderWithDisplayNameAndName.disableNameInput() is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.toggleNameInput(false);
    }

    disableDisplayNameInput() {
        console.warn('WizardHeaderWithDisplayNameAndName.disableDisplayNameInput() ' +
                     'is deprecated and will be removed in lib-admin-ui 4.0.0');
        this.toggleDisplayNameInput(false);
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
