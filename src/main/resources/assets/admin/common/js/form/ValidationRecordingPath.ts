import {PropertyPath} from '../data/PropertyPath';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class ValidationRecordingPath
    implements Equitable {

    private parentDataSet: PropertyPath;

    private dataName: string;

    private refString: string;

    private min: number;

    private max: number;

    constructor(parentPropertySet: PropertyPath, dataName: string, min?: number, max?: number) {
        this.parentDataSet = parentPropertySet != null ? parentPropertySet.asRelative() : null;
        this.dataName = dataName;
        this.refString = this.resolveRefString();
        this.min = min;
        this.max = max;
    }

    getParentDataSet(): PropertyPath {
        return this.parentDataSet;
    }

    getDataName(): string {
        return this.dataName;
    }

    getMin(): number {
        return this.min;
    }

    getMax(): number {
        return this.max;
    }

    toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ValidationRecordingPath)) {
            return false;
        }
        let other = o as ValidationRecordingPath;

        return ObjectHelper.stringEquals(this.refString, other.refString);
    }

    contains(other: ValidationRecordingPath): boolean {
        let fullPath = PropertyPath.fromString(this.refString);
        let otherPath = PropertyPath.fromString(other.refString);

        if (fullPath.elementCount() <= otherPath.elementCount()) {
            return false;
        }

        return otherPath.getElements().every((whatEl, whatIdx) => {
            return fullPath.getElement(whatIdx).toString() === whatEl.toString();
        });
    }

    private resolveRefString(): string {
        let s = '';
        if (this.parentDataSet && !this.parentDataSet.isRoot()) {
            s += this.parentDataSet.toString();
            if (this.dataName) {
                s += '.' + this.dataName;
            }
        } else {
            if (this.dataName) {
                s += this.dataName;
            }
        }

        return s;
    }

}
