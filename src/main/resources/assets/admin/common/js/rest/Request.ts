import * as Q from 'q';
import {AccessDeniedException} from '../AccessDeniedException';
import {Path} from './Path';
import {RequestError} from './RequestError';
import {HttpMethod} from './HttpMethod';
import {Response} from './Response';
import {StatusCode} from './StatusCode';

export abstract class Request {

    protected path: Path;

    protected method: HttpMethod = HttpMethod.GET;

    protected params: Object;

    protected timeoutMillis: number = 10000;

    protected request: XMLHttpRequest = new XMLHttpRequest();

    private status: number;

    constructor(method: HttpMethod) {
        this.method = method;
    }

    setPath(value: Path): Request {
        this.path = value;
        return this;
    }

    setParams(params: Object): Request {
        this.params = params;
        return this;
    }

    setTimeout(timeoutMillis: number): Request {
        this.timeoutMillis = timeoutMillis;
        return this;
    }

    protected bindRequestEventsHandlers(): Q.Deferred<Response> {
        const deferred: Q.Deferred<Response> = Q.defer<Response>();

        this.request.onreadystatechange = () => {
            if (this.request.readyState === 4) {
                let errorJson = null;

                if (this.isRedirect()) {
                    this.status = StatusCode.REDIRECT;
                } else {
                    this.status = this.request.status;
                }

                if (this.request.status === StatusCode.NO_CONTENT) {
                    deferred.resolve(null);
                } else if (this.request.status >= StatusCode.OK && this.request.status < StatusCode.MULTIPLE_OPTIONS) {
                    deferred.resolve(this.request.response);
                } else if (this.request.status === StatusCode.FORBIDDEN) {
                    deferred.reject(new AccessDeniedException('Access denied'));
                } else {
                    try {
                        errorJson = this.request.response ? JSON.parse(this.request.response) : null;
                    } catch (error) {
                        deferred.reject(error);
                    }

                    deferred.reject(new RequestError(this.request.status, errorJson ? errorJson.message : ''));
                }
            }
        };

        return deferred;
    }

    getStatus(): number {
        return this.status;
    }

    send(): Q.Promise<Response> {
        this.prepareRequest();
        return this.sendRequest();
    }

    protected createRequestData(): any {
        return null;
    }

    protected prepareRequest(): void {
        this.request.open(this.method, this.createRequestURI(), true);
        this.request.timeout = this.timeoutMillis;
    }

    protected abstract createRequestURI(): string;

    private sendRequest(): Q.Promise<Response> {
        const deferred = this.bindRequestEventsHandlers();

        this.request.send(this.createRequestData());

        return deferred.promise;
    }

    private isRedirect(): boolean {
        return !this.request.responseURL.endsWith(this.createRequestURI());
    }
}
