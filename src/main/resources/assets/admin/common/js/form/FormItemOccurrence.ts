import {FormItemOccurrenceView} from './FormItemOccurrenceView';
import {FormItemOccurrences} from './FormItemOccurrences';
import {Occurrences} from './Occurrences';
import * as Q from 'q';

export class FormItemOccurrence<V extends FormItemOccurrenceView> {

    private occurrences: FormItemOccurrences<V>;

    private allowedOccurrences: Occurrences;

    private index: number;

    constructor(occurrences: FormItemOccurrences<V>, index: number, allowedOccurrences: Occurrences) {
        this.occurrences = occurrences;
        this.allowedOccurrences = allowedOccurrences;
        this.index = index;
    }

    setIndex(value: number) {
        this.index = value;
    }

    getIndex(): number {
        return this.index;
    }

    isRemoveButtonRequired(): boolean {
        return this.moreThanRequiredOccurrences();
    }

    isRemoveButtonRequiredStrict(): boolean {
        return this.occurrences.countOccurrences() === 1 ? false : this.moreThanRequiredOccurrences();
    }

    maximumOccurrencesReached(): boolean {
        return this.occurrences.maximumOccurrencesReached();
    }

    addOccurrenceAbove(): Q.Promise<V> {
        return this.occurrences.addNewOccurrence(this.index);
    }

    addOccurrenceBelow(): Q.Promise<V> {
        return this.occurrences.addNewOccurrence(this.index + 1);
    }

    showAddButton(): boolean {

        if (!this.isLastOccurrence()) {
            return false;
        }

        return this.lessOccurrencesThanMaximumAllowed();
    }

    public isMultiple(): boolean {
        return this.allowedOccurrences.multiple();
    }

    public oneAndOnly() {
        return this.index === 0 && this.occurrences.countOccurrences() === 1;
    }

    private moreThanRequiredOccurrences() {
        return this.occurrences.countOccurrences() > this.allowedOccurrences.getMinimum();
    }

    private lessOccurrencesThanMaximumAllowed(): boolean {
        return !this.allowedOccurrences.maximumReached(this.occurrences.countOccurrences());
    }

    private isLastOccurrence() {
        return this.index === this.occurrences.countOccurrences() - 1;
    }
}
