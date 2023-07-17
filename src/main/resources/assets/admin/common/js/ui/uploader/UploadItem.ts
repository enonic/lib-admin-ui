import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {FineUploaderFile} from './UploaderEl';

export class UploadItem<MODEL extends Equitable>
    implements Equitable {

    private file: FineUploaderFile;
    private model: MODEL;
    private fileName: string;

    private failedListeners: (() => void)[] = [];
    private uploadStoppedListeners: (() => void)[] = [];
    private uploadListeners: ((model: MODEL) => void)[] = [];
    private progressListeners: ((progress: number) => void)[] = [];

    constructor(file: FineUploaderFile) {
        this.file = file;
        this.fileName = file.name;
    }

    getId(): string {
        return Number(this.file.id).toString();
    }

    getModel(): MODEL {
        return this.model;
    }

    setModel(model: MODEL): UploadItem<MODEL> {
        this.model = model;
        if (model) {
            this.notifyUploaded(model);
        } else {
            this.notifyFailed();
        }
        return this;
    }

    getName(): string {
        return this.fileName;
    }

    setName(name: string): UploadItem<MODEL> {
        this.fileName = name;
        return this;
    }

    getSize(): number {
        return this.file.size;
    }

    setSize(size: number): UploadItem<MODEL> {
        this.file.size = size;
        return this;
    }

    getFileName() {
        return this.file.name;
    }

    getFileType() {
        return this.file.type;
    }

    getProgress(): number {
        return this.file.percent;
    }

    setProgress(progress: number): UploadItem<MODEL> {
        this.file.percent = progress;
        this.notifyProgress(progress);
        return this;
    }

    getStatus(): string {
        return this.file.status;
    }

    setStatus(status: string): UploadItem<MODEL> {
        this.file.status = status;
        return this;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, UploadItem)) {
            return false;
        }

        let other = o as UploadItem<MODEL>;

        if (!ObjectHelper.equals(this.model, other.model)) {
            return false;
        }

        if (this.file && other.file) {

            if (!ObjectHelper.numberEquals(this.file.id, other.file.id) ||
                !ObjectHelper.stringEquals(this.fileName, other.fileName) ||
                !ObjectHelper.numberEquals(this.file.percent, other.file.percent) ||
                //!ObjectHelper.stringEquals(this.file.type, other.file.type) ||
                !ObjectHelper.numberEquals(this.file.size, other.file.size) ||
                //!ObjectHelper.numberEquals(this.file.origSize, other.file.origSize) ||
                this.file.status !== this.file.status) {
                return false;
            }

            /*if (this.file.lastModifiedDate.getMilliseconds() !== other.file.lastModifiedDate.getMilliseconds()) {
                return false;
             }*/

        }

        return (!this.file && !other.file);
    }

    isUploaded(): boolean {
        return !!this.model;
    }

    onProgress(listener: (progress: number) => void) {
        this.progressListeners.push(listener);
    }

    unProgress(listener: (progress: number) => void) {
        this.progressListeners = this.progressListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onUploaded(listener: (model: MODEL) => void) {
        this.uploadListeners.push(listener);
    }

    unUploaded(listener: (model: MODEL) => void) {
        this.uploadListeners = this.uploadListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onFailed(listener: () => void) {
        this.failedListeners.push(listener);
    }

    unFailed(listener: () => void) {
        this.failedListeners = this.failedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyFailed() {
        this.failedListeners.forEach((listener) => {
            listener();
        });
    }

    onUploadStopped(listener: () => void) {
        this.uploadStoppedListeners.push(listener);
    }

    unUploadStopped(listener: () => void) {
        this.uploadStoppedListeners = this.uploadStoppedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyUploadStopped() {
        this.uploadStoppedListeners.forEach((listener) => {
            listener();
        });
    }

    private notifyProgress(progress: number) {
        this.progressListeners.forEach((listener) => {
            listener(progress);
        });
    }

    private notifyUploaded(model: MODEL) {
        this.uploadListeners.forEach((listener) => {
            listener(model);
        });
    }

}
