import {DateHelper, Time} from '../../util/DateHelper';
import {DateTimePicker, DateTimePickerBuilder} from './DateTimePicker';
import {ObjectHelper} from '../../ObjectHelper';

export class TimePickerBuilder
    extends DateTimePickerBuilder {

    hours: number;

    minutes: number;

    inputPlaceholder: string = 'hh:mm';

    manageDate: boolean = false;

    setHours(value: number): TimePickerBuilder {
        this.hours = value;
        return this;
    }

    setMinutes(value: number): TimePickerBuilder {
        this.minutes = value;
        return this;
    }

    build(): TimePicker {
        return new TimePicker(this);
    }
}

export class TimePicker
    extends DateTimePicker {

    constructor(builder: DateTimePickerBuilder) {
        super(builder, 'time-picker');
    }

    protected initData(): void {
        const builder = <TimePickerBuilder>this.builder;
        if (ObjectHelper.bothDefined(builder.hours, builder.minutes)) {
            this.setTime(builder.hours, builder.minutes);
        }
    }

    protected getParsedValue(value: string): Time {
        return DateHelper.parseTime(value);
    }
}
