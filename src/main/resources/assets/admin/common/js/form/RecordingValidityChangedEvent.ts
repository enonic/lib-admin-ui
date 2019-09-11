import {ValidationRecordingPath} from './ValidationRecordingPath';
import {ValidationRecording} from './ValidationRecording';

export class RecordingValidityChangedEvent {

    private origin: ValidationRecordingPath;

    private recording: ValidationRecording;

    private inputValueBroken: boolean = false;

    private includeChildren: boolean = false;

    constructor(recording: ValidationRecording, origin: ValidationRecordingPath) {
        this.recording = recording;
        this.origin = origin;
    }

    getOrigin(): ValidationRecordingPath {
        return this.origin;
    }

    isValid(): boolean {
        return this.recording.isValid() && !this.inputValueBroken;
    }

    getRecording(): ValidationRecording {
        return this.recording;
    }

    setInputValueBroken(broken: boolean): RecordingValidityChangedEvent {
        this.inputValueBroken = broken;
        return this;
    }

    isInputValueBroken(): boolean {
        return this.inputValueBroken;
    }

    setIncludeChildren(include: boolean): RecordingValidityChangedEvent {
        this.includeChildren = include;
        return this;
    }

    isIncludeChildren(): boolean {
        return this.includeChildren;
    }
}
