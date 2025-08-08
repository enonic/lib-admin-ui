import Q from 'q';
import {DivEl} from '../../../dom/DivEl';
import {FormInputEl} from '../../../dom/FormInputEl';
import {SpanEl} from '../../../dom/SpanEl';
import {i18n} from '../../../util/Messages';

export class InputValueLengthCounterEl extends DivEl {

    private readonly inputEl: FormInputEl;

    private readonly totalCounter: SpanEl;

    private readonly leftCounter: SpanEl;

    private readonly maxLength: number;

    private readonly showTotalCounter: boolean;

    constructor(inputEl: FormInputEl, maxLength: number, showCounter: boolean) {
        super('length-counter');

        this.inputEl = inputEl;
        this.maxLength = maxLength;
        this.showTotalCounter = showCounter;
        this.totalCounter = new SpanEl('total-counter');
        this.leftCounter = new SpanEl('left-counter');

        this.initListeners();
    }

    private initListeners() {
        this.inputEl.onValueChanged(() => {
            this.updateLengthCountersValues();
        });

        this.inputEl.onRendered(() => {
            this.inputEl.getParentElement().appendChild(this);
            this.updateLengthCountersValues();
        });
    }

    private updateLengthCountersValues() {
        const value: string = this.inputEl.getValue();

        if (this.showTotalCounter) {
            this.totalCounter.setHtml(i18n('field.value.chars.total', value.length));
        }

        if (this.hasMaxLengthSet()) {
            const charsAllowed: number = this.maxLength - value.length;
            this.leftCounter.toggleClass('chars-left', charsAllowed > -1);
            const textVersion: string = this.showTotalCounter ? 'short' : 'long';
            this.leftCounter.setHtml(i18n(`field.value.chars.left.${textVersion}`, charsAllowed));
        }
    }

    private hasMaxLengthSet() {
        return this.maxLength > -1;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            const separator: SpanEl = new SpanEl('separator').setHtml('/');
            this.appendChildren(this.totalCounter, separator, this.leftCounter);

            return rendered;
        });
    }
}
