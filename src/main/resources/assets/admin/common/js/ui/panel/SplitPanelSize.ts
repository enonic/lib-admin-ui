import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {SplitPanelUnit} from './SplitPanelUnit';

export class SplitPanelSize implements Equitable {

    private readonly value: number;

    private readonly unit: SplitPanelUnit;

    constructor(value: number, unit: SplitPanelUnit) {
        this.value = value;
        this.unit = unit;
    }

    getValue(): number {
        return this.value;
    }

    getUnit(): SplitPanelUnit {
        return this.unit;
    }

    isPercentsUnit(): boolean {
        return this.unit === SplitPanelUnit.PERCENT;
    }

    isPixelsUnit(): boolean {
        return this.unit === SplitPanelUnit.PIXEL;
    }

    isAuto(): boolean {
        return this.value < 0;
    }

    static Pixels(value: number): SplitPanelSize {
        return new SplitPanelSize(value, SplitPanelUnit.PIXEL);
    }

    static Percents(value: number): SplitPanelSize {
        return new SplitPanelSize(value, SplitPanelUnit.PERCENT);
    }

    static Auto(): SplitPanelSize {
        return new SplitPanelSize(-1, SplitPanelUnit.PERCENT);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SplitPanelSize)) {
            return false;
        }

        const other: SplitPanelSize = <SplitPanelSize>o;

        return this.unit === other?.unit && this.value === other?.value;
    }
}
