import * as Q from 'q';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {PrincipalComboBox} from '../../../ui/security/PrincipalComboBox';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {PrincipalType} from '../../../security/PrincipalType';
import {PrincipalKey} from '../../../security/PrincipalKey';
import {BaseInputTypeManagingAdd} from '../support/BaseInputTypeManagingAdd';
import {ObjectHelper} from '../../../ObjectHelper';
import {Input} from '../../Input';
import {Principal} from '../../../security/Principal';
import {SelectedOption} from '../../../ui/selector/combobox/SelectedOption';
import {InputTypeName} from '../../InputTypeName';
import {SelectionChange} from '../../../util/SelectionChange';

export class PrincipalSelector
    extends BaseInputTypeManagingAdd {

    private principalTypes: PrincipalType[];

    private skipPrincipals: PrincipalKey[];

    private comboBox: PrincipalComboBox;

    protected initiallySelectedItems: string[];

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
            this.initiallySelectedItems = this.getSelectedItemsIds();
            this.comboBox = this.createComboBox(input);
            this.appendChild(this.comboBox);

            this.setLayoutInProgress(false);

            return Q<void>(null);
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        let superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.isDirty()) {
            return superPromise.then(() => {
                this.initiallySelectedItems = this.getSelectedItemsIds();
             //   this.comboBox.setValue(this.getValueFromPropertyArray(propertyArray));
            });
        } else {
            return superPromise;
        }
    }

    public isDirty(): boolean {
        return !ObjectHelper.stringArrayEquals(this.initiallySelectedItems, this.getSelectedItemsIds());
    }

    reset() {
        //
    }

    clear(): void {
        super.clear();
        // this.comboBox.clearCombobox();
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
        const principalTypeConfig: Record<string, string>[] = this.context.inputConfig['principalType'] || [];

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

        const skipPrincipalsConfig: Record<string, string>[] = this.context.inputConfig['skipPrincipals'] || [];

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

    protected getPostfixUri(): string {
        return null;
    }

    private createComboBox(input: Input): PrincipalComboBox {
        const comboBox: PrincipalComboBox = new PrincipalComboBox({
            skipPrincipals: this.skipPrincipals.slice(),
            allowedTypes: this.principalTypes.slice(),
            maxSelected: input.getOccurrences().getMaximum(),
            postfixUri: this.getPostfixUri(),
        });


        comboBox.onSelectionChanged((selectionChange: SelectionChange<Principal>) => {
            selectionChange.selected?.forEach((item: Principal) => {
                const key = item.getKey();

                if (!key) {
                    return;
                }

                this.saveToSet(key.toString());
                this.handleValueChanged(false);
            });

            selectionChange.deselected?.forEach((item: Principal) => {
                const property = this.getPropertyArray().getProperties().find((property) => {
                    const propertyValue = property.hasNonNullValue() ? property.getString() : '';
                    return propertyValue === item.getKey().toString();
                });

                if (property) {
                    this.getPropertyArray().remove(property.getIndex());
                    this.handleValueChanged(false);
                }
            });
        });

        comboBox.getSelectedOptionsView().onOptionMoved((selectedOption: SelectedOption<Principal>, fromIndex: number) => {
            this.handleMoved(selectedOption, fromIndex);
        });

        return comboBox;
    }

    private saveToSet(key: string): void {
        const value: Value = ValueTypes.REFERENCE.newValue(key);

        if (!this.getPropertyArray().containsValue(value)) {
            this.ignorePropertyChange(true);
            if (this.comboBox.countSelected() === 1) { // overwrite initial value
                this.getPropertyArray().set(0, value);
            } else {
                this.getPropertyArray().add(value);
            }
            this.ignorePropertyChange(false);
        }
    }

    protected getSelectedItemsIds(): string[] {
        return this.getValueFromPropertyArray(this.getPropertyArray()).split(';');
    }

    protected handleMoved(moved: SelectedOption<Principal>, fromIndex: number) {
        this.ignorePropertyChange(true);
        this.getPropertyArray().move(fromIndex, moved.getIndex());
        this.ignorePropertyChange(false);
    }
}
