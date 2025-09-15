import {Timezone} from '../../util/Timezone';
import {DatePickerPopup, DatePickerPopupBuilder} from './DatePickerPopup';
import {SelectedDateChangedEvent} from './SelectedDateChangedEvent';
import {TimePickerPopup, TimePickerPopupBuilder} from './TimePickerPopup';
import {Element} from '../../dom/Element';
import {TimeHM} from '../../util/TimeHM';
import {PickerPopup} from './Picker';
import {Button} from '../button/Button';
import {i18n} from '../../util/Messages';
import {DivEl} from '../../dom/DivEl';

export class DateTimePickerPopupBuilder {

    manageDate: boolean;

    manageTime: boolean;

    closeOnSelect: boolean;

    defaultValue: Date;

    date: Date;

    defaultTime: TimeHM;

    useLocalTimezone: boolean = false;

    setManageDate(value: boolean): DateTimePickerPopupBuilder {
        this.manageDate = value;
        return this;
    }

    setManageTime(value: boolean): DateTimePickerPopupBuilder {
        this.manageTime = value;
        return this;
    }

    setDefaultValue(value: Date): DateTimePickerPopupBuilder {
         this.defaultValue = value;
         return this;
    }

    setCloseOnSelect(value: boolean): DateTimePickerPopupBuilder {
        this.closeOnSelect = value;
        return this;
    }

    setDate(date: Date): DateTimePickerPopupBuilder {
        this.date = date;
        return this;
    }

    getHours(): number {
        return this.date?.getHours();
    }

    getMinutes(): number {
        return this.date?.getMinutes();
    }

    setUseLocalTimezone(value: boolean): DateTimePickerPopupBuilder {
        this.useLocalTimezone = value;
        return this;
    }

    setDefaultTime(value: TimeHM): DateTimePickerPopupBuilder {
        this.defaultTime = value;
        return this;
    }

    isUseLocalTimezone(): boolean {
        return this.useLocalTimezone;
    }

    build(): DateTimePickerPopup {
        return new DateTimePickerPopup(this);
    }

}

export class DateTimePickerPopup
    extends PickerPopup {

    private readonly datePickerPopup?: DatePickerPopup;

    private readonly timePickerPopup?: TimePickerPopup;

    private readonly defaultValueButton : Button;

    private readonly builder: DateTimePickerPopupBuilder

    constructor(builder: DateTimePickerPopupBuilder) {
        super('date-time-dialog');

        this.builder = builder;

        if (builder.defaultValue) {
            this.defaultValueButton = this.createDefaultValueButton(builder.defaultValue);
        }

        if (builder.manageDate) {
            this.datePickerPopup =
                new DatePickerPopupBuilder()
                    .setDate(builder.date)
                    .build();
        }

        if (builder.manageTime) {
            this.timePickerPopup =
                new TimePickerPopupBuilder()
                    .setHours(builder.getHours())
                    .setUseLocalTimezone(builder.useLocalTimezone)
                    .setMinutes(builder.getMinutes())
                    .setDefaultTime(builder.defaultTime)
                    .build();
        }

        if (builder.manageDate && builder.manageTime && builder.useLocalTimezone) {
            this.timePickerPopup.updateLocalTimezoneByDate(this.getSelectedDateTime());

            this.onSelectedDateChanged((event) => {
                this.timePickerPopup.updateLocalTimezoneByDate(event.getDate());
            });
        }
    }

    createDefaultValueButton(defaultValue: Date): Button {
        const defaultButton = new Button(i18n('action.setDefault'));
        defaultButton.addClass('default-button');
        defaultButton.onClicked(() => {
            if (this.datePickerPopup) {
                this.setSelectedDate(defaultValue);
            }

            if (this.timePickerPopup) {
                this.setSelectedTime(new TimeHM(defaultValue.getHours(), defaultValue.getMinutes()));
            }
        });

        return defaultButton;
    }

    getSelectedDateTime(): Date {
        const selectedDateTime: Date = this.datePickerPopup?.getSelectedDate() || new Date();
        const selectedTime: TimeHM = this.timePickerPopup?.getSelectedTime();
        selectedDateTime.setHours(selectedTime?.hours || 0);
        selectedDateTime.setMinutes(selectedTime?.minutes || 0);

        return selectedDateTime;
    }

    protected getChildElements(): Element[] {
        let inheritedChildElements = super.getChildElements();
        const popupElements: Element[] = [];

        if (this.datePickerPopup) {
            popupElements.push(this.datePickerPopup);
        }

        if (this.timePickerPopup) {
            popupElements.push(this.timePickerPopup);
        }

        const wrapper = new DivEl('picker-buttons');
        if (this.defaultValueButton) {
            wrapper.appendChild(this.defaultValueButton);
        }

        if (this.builder.closeOnSelect) {
            inheritedChildElements = inheritedChildElements.filter((element) => element !== this.getSubmitButton());
        }

        wrapper.appendChildren(...inheritedChildElements);
        popupElements.push(wrapper);

        return popupElements.concat(popupElements);
    }

    onSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.datePickerPopup?.onSelectedDateChanged(listener);
    }

    unSelectedDateChanged(listener: (event: SelectedDateChangedEvent) => void) {
        this.datePickerPopup?.unSelectedDateChanged(listener);
    }

    onSelectedTimeChanged(listener: (time: TimeHM) => void): void {
        this.timePickerPopup?.onSelectedTimeChanged(listener);
    }

    unSelectedTimeChanged(listener: (time: TimeHM) => void): void {
        this.timePickerPopup?.unSelectedTimeChanged(listener);
    }

    setSelectedTime(time: TimeHM, silent?: boolean): void {
        this.timePickerPopup?.setSelectedTime(time, silent);
    }

    setSelectedDate(date: Date, silent?: boolean) {
        this.datePickerPopup?.setSelectedDate(date, silent);
    }

    resetCalendar() {
        this.datePickerPopup?.resetCalendar();
        this.timePickerPopup?.presetTime();
    }
}
