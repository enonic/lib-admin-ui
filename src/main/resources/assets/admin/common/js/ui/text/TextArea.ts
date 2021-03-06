import {FormInputEl} from '../../dom/FormInputEl';
import {Element} from '../../dom/Element';
import {DivEl} from '../../dom/DivEl';
import {WindowDOM} from '../../dom/WindowDOM';
import {StringHelper} from '../../util/StringHelper';

export class TextArea
    extends FormInputEl {

    private attendant: Element;

    private clone: Element;

    constructor(name: string, originalValue?: string) {
        super('textarea', 'text-area', undefined, originalValue);
        this.getEl().setAttribute('name', name);

        this.onInput(() => {
            this.refreshDirtyState();
            this.refreshValueChanged();
        });

        this.clone = new DivEl('autosize-clone').addClass(this.getEl().getAttribute('class'));
        this.attendant = new DivEl('autosize-attendant');
        this.attendant.appendChild(this.clone);

        this.onAdded(() => this.attendant.insertAfterEl(this));
        this.onRendered(() => this.updateSize());
        this.onShown(() => this.updateSize());
        this.onFocus(() => this.updateSize());
        this.onValueChanged(() => this.updateSize());
        WindowDOM.get().onResized(() => this.updateSize(), this);
    }

    setRows(rows: number) {
        this.getEl().setAttribute('rows', rows.toString());
    }

    setColumns(columns: number) {
        this.getEl().setAttribute('cols', columns.toString());
    }

    private updateSize() {
        if (this.isRendered()) {
            this.clone.getEl().setInnerHtml(this.getValue() + ' ');
            this.getEl().setHeightPx(this.clone.getEl().getHeightWithBorder());
        }
    }

    updateValidationStatusOnUserInput(isValid: boolean) {
        this.toggleClass('valid', isValid && !StringHelper.isEmpty(this.getValue()));
        this.toggleClass('invalid', !isValid);
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.getEl().setDisabled(!enable);
    }
}
