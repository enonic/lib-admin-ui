import {InputValidationRecording} from './InputValidationRecording';

export class InputValidityChangedEvent {

    private readonly recording: InputValidationRecording;

    constructor(recording: InputValidationRecording) {
        this.recording = recording;
    }

    isValid(): boolean {
        return this.recording.isValid();
    }

    getRecording(): InputValidationRecording {
        return this.recording;
    }
}
