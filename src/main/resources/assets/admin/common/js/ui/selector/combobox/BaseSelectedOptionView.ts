import * as Q from 'q';
import {DivEl} from '../../../dom/DivEl';
import {Option} from '../Option';
import {Element} from '../../../dom/Element';
import {AEl} from '../../../dom/AEl';
import {SelectedOptionView} from './SelectedOptionView';

export class BaseSelectedOptionView<T>
    extends DivEl
    implements SelectedOptionView<T> {

    private option: Option<T>;

    private optionValueEl: DivEl;

    private removeClickedListeners: { (): void; }[] = [];

    private editable: boolean;

    private removable: boolean;

    constructor(option: Option<T>, editable: boolean = true, removable: boolean = true) {
        super('selected-option');

        this.option = option;
        this.editable = editable;
        this.removable = removable;
    }

    setOption(option: Option<T>) {
        if (this.optionValueEl) {
            this.optionValueEl.getEl().setInnerHtml(option.displayValue.toString());
        }
        this.option = option;
    }

    getOption(): Option<T> {
        return this.option;
    }

    doRender(): Q.Promise<boolean> {

        this.optionValueEl = new DivEl('option-value');
        if (this.option) {
            this.setOption(this.option);
        }
        this.appendChild(this.optionValueEl);

        this.appendActionButtons();

        return Q(true);
    }

    onRemoveClicked(listener: { (): void; }) {
        this.removeClickedListeners.push(listener);
    }

    unRemoveClicked(listener: { (): void; }) {
        this.removeClickedListeners = this.removeClickedListeners.filter(function (curr: { (): void; }) {
            return curr !== listener;
        });
    }

    setReadonly(readonly: boolean) {
        this.editable = readonly ? false : this.editable;
        this.removable = readonly ? false : this.removable;
    }

    setEditable(editable: boolean) {
        this.editable = editable;
    }

    setRemovable(removable: boolean) {
        this.removable = removable;
    }

    isEditable(): boolean {
        return this.editable;
    }

    protected appendActionButtons(container: Element = this) {
        if (this.editable) {
            container.appendChild(this.createEditButton());
        }
        if (this.removable) {
            container.appendChild(this.createRemoveButton());
        }
    }

    protected notifyRemoveClicked() {
        this.removeClickedListeners.forEach((listener) => {
            listener();
        });
    }

    protected onEditButtonClicked(e: MouseEvent): boolean {
        e.stopPropagation();
        e.preventDefault();

        return false;
    }

    protected onRemoveButtonClicked(e: MouseEvent): boolean {
        this.notifyRemoveClicked();

        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    private createEditButton(): AEl {
        let editButton = new AEl('edit');
        editButton.onClicked((event: MouseEvent) => this.onEditButtonClicked(event));

        return editButton;
    }

    private createRemoveButton(): AEl {
        let removeButton = new AEl('remove');
        removeButton.onClicked((event: MouseEvent) => this.onRemoveButtonClicked(event));

        return removeButton;
    }
}
