import {ValidationRecordingPath} from './ValidationRecordingPath';
import {AdditionalValidationRecord} from './AdditionalValidationRecord';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';

export class ValidationRecording {

    private breaksMinimumOccurrencesArray: ValidationRecordingPath[] = [];

    private breaksMaximumOccurrencesArray: ValidationRecordingPath[] = [];

    private errorMessage: string;

    breaksMinimumOccurrences(path: ValidationRecordingPath) {
        if (!this.exists(path, this.breaksMinimumOccurrencesArray)) {
            this.breaksMinimumOccurrencesArray.push(path);
        }
    }

    breaksMaximumOccurrences(path: ValidationRecordingPath) {
        if (!this.exists(path, this.breaksMaximumOccurrencesArray)) {
            this.breaksMaximumOccurrencesArray.push(path);
        }
    }

    setErrorMessage(value: string): void {
        this.errorMessage = value;
    }

    isValid(): boolean {
        return !this.hasError() && this.breaksMinimumOccurrencesArray.length === 0 && this.breaksMaximumOccurrencesArray.length === 0;
    }

    hasError(): boolean {
        return !StringHelper.isBlank(this.errorMessage);
    }

    isMinimumOccurrencesValid(): boolean {
        return this.breaksMinimumOccurrencesArray.length === 0;
    }

    isMaximumOccurrencesValid(): boolean {
        return this.breaksMaximumOccurrencesArray.length === 0;
    }

    getBreakMinimumOccurrences(): ValidationRecordingPath[] {
        return this.breaksMinimumOccurrencesArray;
    }

    getBreakMaximumOccurrences(): ValidationRecordingPath[] {
        return this.breaksMaximumOccurrencesArray;
    }

    getErrorMessage(): string {
        return this.errorMessage;
    }

    flatten(recording: ValidationRecording) {

        recording.breaksMinimumOccurrencesArray.forEach((path: ValidationRecordingPath) => {
            this.breaksMinimumOccurrences(path);
        });

        recording.breaksMaximumOccurrencesArray.forEach((path: ValidationRecordingPath) => {
            this.breaksMaximumOccurrences(path);
        });

        this.setErrorMessage(recording.getErrorMessage());
    }

    /**
     * @param path - path to remove
     * @param strict - whether to match only exact matching paths
     * @param includeChildren - param saying if nested children should be removed as well
     */
    removeByPath(path: ValidationRecordingPath, strict?: boolean, includeChildren?: boolean) {
        this.removeUnreachedMinimumOccurrencesByPath(path, strict, includeChildren);
        this.removeBreachedMaximumOccurrencesByPath(path, strict, includeChildren);
    }

    removeUnreachedMinimumOccurrencesByPath(path: ValidationRecordingPath, strict?: boolean, includeChildren?: boolean) {

        for (let i = this.breaksMinimumOccurrencesArray.length - 1; i >= 0; i--) {
            let currentPath = this.breaksMinimumOccurrencesArray[i];
            let remove = currentPath.equals(path) ||
                         includeChildren && (strict && currentPath.contains(path) ||
                         !strict && currentPath.toString().indexOf(path.toString()) === 0);
            if (remove) {
                this.breaksMinimumOccurrencesArray.splice(i, 1);
                if (!includeChildren) {
                    break;
                }
            }
        }
    }

    removeBreachedMaximumOccurrencesByPath(path: ValidationRecordingPath, strict?: boolean, includeChildren?: boolean) {

        for (let i = this.breaksMaximumOccurrencesArray.length - 1; i >= 0; i--) {
            let currentPath = this.breaksMaximumOccurrencesArray[0];
            let remove = currentPath.equals(path) ||
                         includeChildren && (strict && currentPath.contains(path) ||
                         !strict && currentPath.toString().indexOf(path.toString()) === 0);
            if (remove) {
                this.breaksMaximumOccurrencesArray.splice(i, 1);
                if (!includeChildren) {
                    break;
                }
            }
        }
    }

    equals(other: ValidationRecording): boolean {

        if (this.breaksMinimumOccurrencesArray.length !== other.breaksMinimumOccurrencesArray.length) {
            return false;
        } else if (this.breaksMaximumOccurrencesArray.length !== other.breaksMaximumOccurrencesArray.length) {
            return false;
        }

        for (let i = 0; i < this.breaksMinimumOccurrencesArray.length; i++) {
            if (this.breaksMinimumOccurrencesArray[i].toString() !== other.breaksMinimumOccurrencesArray[i].toString()) {
                return false;
            }
        }

        for (let i = 0; i < this.breaksMaximumOccurrencesArray.length; i++) {
            if (this.breaksMaximumOccurrencesArray[i].toString() !== other.breaksMaximumOccurrencesArray[i].toString()) {
                return false;
            }
        }

        return ObjectHelper.stringEquals(this.errorMessage, other.errorMessage);
    }

    validityChanged(previous: ValidationRecording): boolean {
        return !!previous && !previous.equals(this);
    }

    containsPathInBreaksMin(path: ValidationRecordingPath) {
        return this.exists(path, this.breaksMinimumOccurrencesArray);
    }

    containsPathInBreaksMax(path: ValidationRecordingPath) {
        return this.exists(path, this.breaksMaximumOccurrencesArray);
    }

    private exists(path: ValidationRecordingPath, array: ValidationRecordingPath[]): boolean {
        for (let i = 0; i < array.length; i++) {
            if (array[i].toString() === path.toString()) {
                return true;
            }
        }
        return false;
    }

    /*
     * Should be moved to ObjectHelper.ts after changing gulp to webpack in common module
     * */
    private mapEquals(mapA: Map<string, Equitable>, mapB: Map<string, Equitable>): boolean {
        if (mapA.size !== mapB.size) {
            return false;
        }

        const keys: string[] = [];
        mapA.forEach((_value: Equitable, key: string) => {
            keys.push(key);
        });

        return keys.every(key => {
            return mapA.get(key).equals(mapB.get(key));
        });
    }
}
