import type {PropertySet} from '../../data/PropertySet';
import type {Occurrences} from '../../form/Occurrences';

export type SetOccurrenceManagerState = {
    readonly ids: string[];
    readonly count: number;
    readonly isMinimumBreached: boolean;
    readonly isMaximumBreached: boolean;
    readonly canAdd: boolean;
    readonly canRemove: boolean;
};

/**
 * Pure count/ID state machine for set occurrences (FormItemSet/FormOptionSet).
 *
 * Unlike OccurrenceManager, this class does not track descriptors or per-value
 * validation — it only manages occurrence count and stable IDs.
 */
export class SetOccurrenceManager {
    private readonly occurrences: Occurrences;
    private propertySets: PropertySet[];
    private ids: string[];
    private nextId = 0;

    constructor(occurrences: Occurrences, initialPropertySets: PropertySet[] = []) {
        this.occurrences = occurrences;
        this.propertySets = [...initialPropertySets];
        this.ids = this.propertySets.map(() => this.generateId());
    }

    private generateId(): string {
        return `set-occurrence-${this.nextId++}`;
    }

    // ? No maximum enforcement — reflects external data as-is. Validation reports isMaximumBreached.
    syncPropertySets(propertySets: PropertySet[]): void {
        const oldIds = this.ids;
        const oldSets = this.propertySets;
        this.propertySets = [...propertySets];
        this.ids = propertySets.map((ps, i) =>
            i < oldSets.length && oldSets[i] === ps ? oldIds[i] : this.generateId(),
        );
    }

    // ? Only adds an ID. The consumer must add the PropertySet to the
    // ? data tree; the next syncPropertySets() call will reconcile.
    add(): {id: string} | null {
        if (this.isMaximumReached()) {
            return null;
        }

        const id = this.generateId();
        this.ids.push(id);
        return {id};
    }

    remove(index: number): boolean {
        if (index < 0 || index >= this.ids.length) {
            return false;
        }

        this.propertySets.splice(index, 1);
        this.ids.splice(index, 1);
        return true;
    }

    move(fromIndex: number, toIndex: number): boolean {
        if (
            fromIndex < 0 ||
            fromIndex >= this.ids.length ||
            toIndex < 0 ||
            toIndex >= this.ids.length ||
            fromIndex === toIndex
        ) {
            return false;
        }

        const [movedSet] = this.propertySets.splice(fromIndex, 1);
        this.propertySets.splice(toIndex, 0, movedSet);

        const [movedId] = this.ids.splice(fromIndex, 1);
        this.ids.splice(toIndex, 0, movedId);
        return true;
    }

    getState(): SetOccurrenceManagerState {
        const count = this.ids.length;

        return {
            ids: [...this.ids],
            count,
            isMinimumBreached: this.occurrences.minimumBreached(count),
            isMaximumBreached: this.occurrences.maximumBreached(count),
            canAdd: this.canAdd(),
            canRemove: this.canRemove(),
        };
    }

    getId(index: number): string | undefined {
        return this.ids[index];
    }

    private canAdd(): boolean {
        return !this.isMaximumReached();
    }

    private canRemove(): boolean {
        return this.ids.length > this.occurrences.getMinimum();
    }

    private isMaximumReached(): boolean {
        return this.occurrences.maximumReached(this.ids.length);
    }
}
