import Q from 'q';
import {PostRequest} from './PostRequest';
import {Response} from './Response';

export interface UploadProgressResponse {
    loaded: number;
    total: number;
}

export type ProgressListener = (progress: UploadProgressResponse) => void;

export class UploadRequest
    extends PostRequest {

    private static UPLOAD_TIMEOUT: number = 120000;

    private progressListeners: ProgressListener[];

    private abortListeners: ProgressListener[];

    private timeoutListeners: ProgressListener[];

    private errorListeners: ProgressListener[];

    constructor() {
        super();

        this.progressListeners = [];
        this.abortListeners = [];
        this.timeoutListeners = [];
        this.errorListeners = [];

        this.setIsFormRequest(true);
        this.setTimeout(UploadRequest.UPLOAD_TIMEOUT);
    }

    onProgress(listener: (progress: UploadProgressResponse) => void): UploadRequest {
        this.progressListeners.push(listener);
        return this;
    }

    unProgress(listener: (progress: UploadProgressResponse) => void): UploadRequest {
        this.progressListeners = this.progressListeners.filter((curr: ProgressListener) => curr !== listener);
        return this;
    }

    private notifyProgress(response: UploadProgressResponse): void {
        this.progressListeners.forEach((listener) => {
            listener(response);
        });
    }

    onAbort(listener: (abort: UploadProgressResponse) => void): UploadRequest {
        this.abortListeners.push(listener);
        return this;
    }

    unAbort(listener: (abort: UploadProgressResponse) => void): UploadRequest {
        this.abortListeners = this.abortListeners.filter((curr: ProgressListener) => curr !== listener);
        return this;
    }

    private notifyAbort(response: UploadProgressResponse): void {
        this.abortListeners.forEach((listener) => {
            listener(response);
        });
    }

    onTimeout(listener: (timeout: UploadProgressResponse) => void): UploadRequest {
        this.timeoutListeners.push(listener);
        return this;
    }

    unTimeout(listener: (timeout: UploadProgressResponse) => void): UploadRequest {
        this.timeoutListeners = this.timeoutListeners.filter((curr: ProgressListener) => curr !== listener);
        return this;
    }

    private notifyTimeout(response: UploadProgressResponse): void {
        this.timeoutListeners.forEach((listener) => {
            listener(response);
        });
    }

    onError(listener: (error: UploadProgressResponse) => void): UploadRequest {
        this.errorListeners.push(listener);
        return this;
    }

    unError(listener: (error: UploadProgressResponse) => void): UploadRequest {
        this.errorListeners = this.errorListeners.filter((curr: ProgressListener) => curr !== listener);
        return this;
    }

    private notifyError(response: UploadProgressResponse): void {
        this.errorListeners.forEach((listener) => {
            listener(response);
        });
    }

    protected bindRequestEventsHandlers(): Q.Deferred<Response> {
        const deferred = super.bindRequestEventsHandlers();

        const {upload} = this.request;

        const eventToResponse = (event: ProgressEvent) => ({loaded: event.loaded, total: event.total});

        upload.onprogress = (event: ProgressEvent) => this.notifyProgress(eventToResponse(event));

        upload.onabort = (event: ProgressEvent) => this.notifyAbort(eventToResponse(event));

        upload.ontimeout = (event: ProgressEvent) => this.notifyTimeout(eventToResponse(event));

        upload.onerror = (event: ProgressEvent) => this.notifyError(eventToResponse(event));

        return deferred;
    }
}
