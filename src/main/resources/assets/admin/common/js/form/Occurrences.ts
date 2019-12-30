import {Equitable} from '../Equitable';
import {OccurrencesJson} from './json/OccurrencesJson';
import {ObjectHelper} from '../ObjectHelper';

export class OccurrencesBuilder {

    minimum: number;

    maximum: number;

    setMinimum(value: number): OccurrencesBuilder {
        this.minimum = value;
        return this;
    }

    setMaximum(value: number): OccurrencesBuilder {
        this.maximum = value;
        return this;
    }

    fromJson(json: OccurrencesJson) {
        this.minimum = json.minimum;
        this.maximum = json.maximum;
    }

    build(): Occurrences {
        return new Occurrences(this);
    }
}

export class Occurrences
    implements Equitable {

    private minimum: number;

    private maximum: number;

    constructor(builder: OccurrencesBuilder) {
        this.minimum = builder.minimum;
        this.maximum = builder.maximum;
    }

    static fromJson(json: OccurrencesJson): Occurrences {
        let builder = new OccurrencesBuilder();
        builder.fromJson(json);
        return builder.build();
    }

    getMaximum(): number {
        return this.maximum;
    }

    getMinimum(): number {
        return this.minimum;
    }

    required(): boolean {
        return this.minimum > 0;
    }

    multiple(): boolean {
        return this.maximum > 1 || this.maximum === 0;
    }

    minimumReached(occurrenceCount: number): boolean {
        return occurrenceCount >= this.minimum;
    }

    minimumBreached(occurrenceCount: number): boolean {
        return (this.minimum === 0) ? false : (occurrenceCount < this.minimum);
    }

    maximumReached(occurrenceCount: number): boolean {
        if (this.maximum === 0) {
            return false;
        }
        return occurrenceCount >= this.maximum;
    }

    maximumBreached(occurrenceCount: number): boolean {
        if (this.maximum === 0) {
            return false;
        }
        return occurrenceCount > this.maximum;
    }

    public toJson(): OccurrencesJson {

        return <OccurrencesJson>{
            maximum: this.getMaximum(),
            minimum: this.getMinimum()
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Occurrences)) {
            return false;
        }

        let other = <Occurrences>o;

        if (!ObjectHelper.numberEquals(this.minimum, other.minimum)) {
            return false;
        }

        if (!ObjectHelper.numberEquals(this.maximum, other.maximum)) {
            return false;
        }

        return true;
    }
}
