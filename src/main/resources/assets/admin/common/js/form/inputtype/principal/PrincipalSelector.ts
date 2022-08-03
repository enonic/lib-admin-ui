import * as Q from 'q';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {SelectedOptionEvent} from '../../../ui/selector/combobox/SelectedOptionEvent';
import {PrincipalComboBox, PrincipalSelectedOptionView} from '../../../ui/security/PrincipalComboBox';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {PrincipalType} from '../../../security/PrincipalType';
import {PrincipalKey} from '../../../security/PrincipalKey';
import {BaseInputTypeManagingAdd} from '../support/BaseInputTypeManagingAdd';
import {ObjectHelper} from '../../../ObjectHelper';
import {Input} from '../../Input';
import {PrincipalLoader} from '../../../security/PrincipalLoader';
import {Principal} from '../../../security/Principal';
import {SelectedOption} from '../../../ui/selector/combobox/SelectedOption';
import {Option} from '../../../ui/selector/Option';
import {InputTypeName} from '../../InputTypeName';

export class PrincipalSelector
    extends BaseInputTypeManagingAdd {

    private principalTypes: PrincipalType[];

    private skipPrincipals: PrincipalKey[];

    private comboBox: PrincipalComboBox;

    constructor(context: InputTypeViewContext) {
        super(context, 'principal-selector');
    }

    static getName(): InputTypeName {
        return new InputTypeName('PrincipalSelector', false);
    }

    public getPrincipalComboBox(): PrincipalComboBox {
        return this.comboBox;
    }

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            this.comboBox = this.createComboBox(input);
            this.appendChild(this.comboBox);

            this.setLayoutInProgress(false);

            return Q<void>(null);
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.comboBox.isDirty()) {
            return superPromise.then(() => {
                this.comboBox.setValue(this.getValueFromPropertyArray(propertyArray));
            });
        } else {
            return superPromise;
        }
    }

    reset() {
        this.comboBox.resetBaseValues();
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.comboBox.setEnabled(enable);
    }

    giveFocus(): boolean {
        if (this.comboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.comboBox.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.unBlur(listener);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    protected readInputConfig(): void {
        const principalTypeConfig: { [name: string]: string }[] = this.context.inputConfig['principalType'] || [];

        this.principalTypes = [].concat(principalTypeConfig)
            .map((cfg: any) => {
                let val: string;
                if (typeof cfg === 'object') {
                    val = cfg['value'];
                } else {
                    val = cfg;
                }
                return val ? PrincipalType[val] : null;
            })
            .filter((val) => val !== null);

        const skipPrincipalsConfig: { [name: string]: string }[] = this.context.inputConfig['skipPrincipals'] || [];

        this.skipPrincipals = [].concat(skipPrincipalsConfig)
            .map((cfg: any) => {
                let val: string;
                if (ObjectHelper.iFrameSafeInstanceOf(cfg, PrincipalKey)) {
                    return cfg;
                } else if (typeof cfg === 'object') {
                    val = cfg['value'];
                } else {
                    val = cfg;
                }
                return !!val ? PrincipalKey.fromString(val) : null;
            })
            .filter((val) => val !== null);
    }

    protected createLoader(): PrincipalLoader {
        return new PrincipalLoader();
    }

    private createComboBox(input: Input): PrincipalComboBox {
        const value: string = this.getValueFromPropertyArray(this.getPropertyArray());
        const principalLoader: PrincipalLoader =
            this.createLoader()
            .setAllowedTypes(this.principalTypes)
            .skipPrincipals(this.skipPrincipals);

        const comboBox: PrincipalComboBox = <PrincipalComboBox>PrincipalComboBox.create()
            .setLoader(principalLoader)
            .setMaximumOccurrences(input.getOccurrences().getMaximum())
            .setValue(value)
            .build();

        comboBox.onOptionDeselected((event: SelectedOptionEvent<Principal>) => {
            this.getPropertyArray().remove(event.getSelectedOption().getIndex());
            this.handleValueChanged(false);
        });

        comboBox.onOptionSelected((event: SelectedOptionEvent<Principal>) => {
            this.fireFocusSwitchEvent(event);

            const selectedOption = event.getSelectedOption();
            let key = selectedOption.getOption().getDisplayValue().getKey();
            if (!key) {
                return;
            }
            let selectedOptionView: PrincipalSelectedOptionView = <PrincipalSelectedOptionView>selectedOption.getOptionView();
            this.saveToSet(selectedOptionView.getOption(), selectedOption.getIndex());
            this.handleValueChanged(false);
        });

        comboBox.onOptionMoved((selectedOption: SelectedOption<Principal>, fromIndex: number) => {
            this.getPropertyArray().move(fromIndex, selectedOption.getIndex());
            this.validate(false);
        });

        return comboBox;
    }

    private saveToSet(principalOption: Option<Principal>, index: number) {
        this.getPropertyArray().set(index, ValueTypes.REFERENCE.newValue(principalOption.getValue()));
    }

}
