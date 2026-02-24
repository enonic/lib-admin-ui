import * as Q from 'q';
import {DivEl} from '../../../dom/DivEl';
import {Option} from '../Option';
import {AEl} from '../../../dom/AEl';
import {SelectedOptionView} from './SelectedOptionView';
import {AriaRole} from '../../WCAG';
import {i18n} from '../../../util/Messages';

export class BaseSelectedOptionView<T>
    extends DivEl
    implements SelectedOptionView<T> {

    protected option: Option<T>;

    protected optionValueEl: DivEl;

    private removeClickedListeners: (() => void)[] = [];

    protected editable: boolean;

    private editButton?: AEl;

    protected removable: boolean;

    private removeButton?: AEl;

    constructor(builder: BaseSelectedOptionViewBuilder<T>) {
        super('selected-option');

        this.option = builder.option;
        this.editable = builder.editable;
        this.removable = builder.removable;
    }

    setOption(option: Option<T>) {
        if (this.optionValueEl) {
            this.optionValueEl.getEl().setInnerHtml(String(option.getDisplayValue()));
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

    onRemoveClicked(listener: () => void) {
        this.removeClickedListeners.push(listener);
    }

    unRemoveClicked(listener: () => void) {
        this.removeClickedListeners = this.removeClickedListeners.filter(function (curr: () => void) {
            return curr !== listener;
        });
    }

    setReadonly(readonly: boolean) {
        this.toggleClass('readonly', readonly);
    }

    setEditable(editable: boolean) {
        this.editable = editable;

        if (this.isRendered()) {
            if (editable && !this.editButton) {
                this.appendChild(this.createEditButton());
            }

            this.editButton?.setVisible(editable);
        }
    }

    setRemovable(removable: boolean) {
        this.removable = removable;

        if (this.isRendered()) {
            if (removable && !this.removeButton) {
                this.appendChild(this.createRemoveButton());
            }

            this.removeButton?.setVisible(removable);
        }
    }

    isEditable(): boolean {
        return this.editable;
    }

    isRemovable(): boolean {
        return this.removable;
    }

    protected appendActionButtons() {
        if (this.editable && !this.editButton) {
            this.appendChild(this.createEditButton());
        }

        if (this.removable && !this.removeButton) {
            this.appendChild(this.createRemoveButton());
        }
    }

    protected notifyRemoveClicked() {
        this.removeClickedListeners.forEach((listener) => {
            listener();
        });
    }

    protected onEditButtonClicked(e: MouseEvent): boolean {
        e.preventDefault();

        return false;
    }

    protected onRemoveButtonClicked(e: MouseEvent): boolean {
        this.notifyRemoveClicked();

        e.preventDefault();
        return false;
    }

    private createEditButton(): AEl {
        this.editButton = new AEl('edit');
        this.editButton.setRole(AriaRole.BUTTON).setTitle(i18n('action.edit'));
        this.editButton.onClicked((event: MouseEvent) => this.onEditButtonClicked(event));

        return this.editButton;
    }

    private createRemoveButton(): AEl {
        const removeButton = new AEl('remove');
        removeButton.setRole(AriaRole.BUTTON).setTitle(i18n('action.removeSelected'));
        removeButton.onClicked((event: MouseEvent) => this.onRemoveButtonClicked(event));

        return removeButton;
    }
}

export class BaseSelectedOptionViewBuilder<T> {
    option: Option<T>;

    editable: boolean = false;

    removable: boolean = true;

    setOption(option: Option<T>): BaseSelectedOptionViewBuilder<T> {
        this.option = option;
        return this;
    }

    setEditable(value: boolean): BaseSelectedOptionViewBuilder<T> {
        this.editable = value;

        return this;
    }

    setRemovable(value: boolean): BaseSelectedOptionViewBuilder<T> {
        this.removable = value;

        return this;
    }

}
