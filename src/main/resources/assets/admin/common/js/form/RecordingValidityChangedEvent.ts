import {ValidationRecordingPath} from './ValidationRecordingPath';
import {ValidationRecording} from './ValidationRecording';

export class RecordingValidityChangedEvent {

    private readonly origin: ValidationRecordingPath;

    private readonly recording: ValidationRecording;

    private includeChildren: boolean = false;

    constructor(recording: ValidationRecording, origin: ValidationRecordingPath) {
        this.recording = recording;
        this.origin = origin;
    }

    getOrigin(): ValidationRecordingPath {
        return this.origin;
    }

    isValid(): boolean {
        return this.recording.isValid();
    }

    getRecording(): ValidationRecording {
        return new ValidationRecording(this.recording);
    }

    setIncludeChildren(include: boolean): RecordingValidityChangedEvent {
        this.includeChildren = include;
        return this;
    }

    isIncludeChildren(): boolean {
        return this.includeChildren;
    }
}
