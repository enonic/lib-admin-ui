export class SelectedDateChangedEvent {

    private readonly date: Date;

    private readonly userInput: boolean;

    constructor(selectedDate: Date, userInput?: boolean) {
        this.date = selectedDate;
        this.userInput = userInput;
    }

    getDate(): Date {
        return this.date;
    }

    isUserInput(): boolean {
        return this.userInput;
    }
}
