import {Option} from '../Option';

export class SelectedOption<T> {

    private optionView: SelectedOptionView<T>;

    private index: number;

    constructor(optionView: SelectedOptionView<T>, index: number) {
        assertNotNull(optionView, 'optionView cannot be null');

        this.optionView = optionView;
        this.index = index;
    }

    getOption(): Option<T> {
        return this.optionView.getOption();
    }

    getOptionView(): SelectedOptionView<T> {
        return this.optionView;
    }

    getIndex(): number {
        return this.index;
    }

    setIndex(value: number) {
        this.index = value;
    }
}
