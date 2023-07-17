import {DivEl} from '../../../dom/DivEl';
import {Option} from '../Option';
import {Viewer} from '../../Viewer';

export class SelectedOptionView<T>
    extends DivEl {

    private objectViewer: Viewer<T>;

    private optionValueEl: DivEl;

    private option: Option<T>;

    private openDropdownListeners: (() => void)[] = [];

    constructor(objectViewer: Viewer<T>, skipExpandOnClick: boolean = false) {
        super('selected-option');
        this.objectViewer = objectViewer;
        this.optionValueEl = new DivEl('option-value');
        this.appendChild(this.optionValueEl);
        this.optionValueEl.appendChild(this.objectViewer);

        if (!skipExpandOnClick) {
            this.onClicked(() => {

                if (document['selection'] && document['selection'].empty) {
                    document['selection'].empty();
                } else if (window.getSelection) {
                    let sel = window.getSelection();
                    sel.removeAllRanges();
                }

                this.notifyOpenDropdown();
            });
        }

        this.onKeyPressed((event: KeyboardEvent) => {
            if (event.which === 32 || event.which === 13) { // space or enter
                this.notifyOpenDropdown();
            }
        });
    }

    setOption(option: Option<T>) {
        this.option = option;
        this.objectViewer.setObject(option.getDisplayValue());
    }

    getOption(): Option<T> {
        return this.option;
    }

    hasOption(): boolean {
        return !!this.option;
    }

    resetOption() {
        this.option = null;
    }

    onOpenDropdown(listener: () => void) {
        this.openDropdownListeners.push(listener);
    }

    unOpenDropdown(listener: () => void) {
        this.openDropdownListeners = this.openDropdownListeners.filter(function (curr: () => void) {
            return curr !== listener;
        });
    }

    private notifyOpenDropdown() {
        this.openDropdownListeners.forEach((listener) => {
            listener();
        });
    }
}
