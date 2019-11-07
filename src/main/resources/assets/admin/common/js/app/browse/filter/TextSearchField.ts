import {InputEl} from '../../../dom/InputEl';

export class TextSearchField
    extends InputEl {

    private timerId: number;

    constructor(placeholder?: string) {
        super('text-search-field');
        this.setPlaceholder(placeholder);

        this.onKeyDown((event: KeyboardEvent) => {
            if (event.which === 9) {
                // tab
            } else if (event.which === 13) {
                // enter
                this.refreshDirtyState();
                this.refreshValueChanged();
            } else {
                if (this.timerId != null) {
                    window.clearTimeout(this.timerId);
                    this.timerId = null;
                }
                this.timerId = window.setTimeout(() => {
                    this.refreshDirtyState();
                    this.refreshValueChanged();
                }, 500);
            }
        });
    }

    clear() {
        window.clearTimeout(this.timerId);
        this.setValue('', true);
    }

    protected handleInput() {
        //overriding super.handleInput method
        //we handle onKeyDown event instead of onInput as onInput does not fire for 'enter' and 'tab' keys
    }
}
