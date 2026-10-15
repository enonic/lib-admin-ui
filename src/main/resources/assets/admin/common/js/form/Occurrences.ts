import {Occurrences} from '@enonic/input-types/schema';
import type {OccurrencesJson} from '@enonic/ui-types';

export class OccurrencesBuilder {

    minimum: number = 0;

    maximum: number = 0;

    setMinimum(value: number): OccurrencesBuilder {
        this.minimum = value;
        return this;
    }

    setMaximum(value: number): OccurrencesBuilder {
        this.maximum = value;
        return this;
    }

    fromJson(json: OccurrencesJson): OccurrencesBuilder {
        this.minimum = json.minimum;
        this.maximum = json.maximum;
        return this;
    }

    build(): Occurrences {
        return Occurrences.minmax(this.minimum, this.maximum);
    }
}
