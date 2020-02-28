import * as Q from 'q';
import {AccessDeniedException} from '../AccessDeniedException';
import {Path} from './Path';
import {JsonResponse} from './JsonResponse';
import {RequestError} from './RequestError';
import {HttpMethod} from './HttpMethod';

export abstract class JsonRequest {

    protected path: Path;

    protected method: HttpMethod = HttpMethod.GET;

    protected params: Object;

    protected timeoutMillis: number = 10000;

    protected request: XMLHttpRequest = new XMLHttpRequest();

    constructor(method: HttpMethod) {
        this.method = method;
    }

    setPath(value: Path): JsonRequest {
        this.path = value;
        return this;
    }

    setParams(params: Object): JsonRequest {
        this.params = params;
        return this;
    }

    setTimeout(timeoutMillis: number): JsonRequest {
        this.timeoutMillis = timeoutMillis;
        return this;
    }

    handleReadyStateChanged(deferred: Q.Deferred<JsonResponse<any>>): JsonRequest {
        this.request.onreadystatechange = () => {
            if (this.request.readyState === 4) {
                let errorJson = null;

                if (this.request.status === 204) {
                    deferred.resolve(new JsonResponse(null));
                } else if (this.request.status >= 200 && this.request.status < 300) {
                    deferred.resolve(new JsonResponse(this.request.response));
                } else if (this.request.status === 403) {
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

        return this;
    }

    send() {
        this.prepareRequest();
        this.request.send(this.createRequestData());
    }

    protected createRequestData(): any {
        return null;
    }

    protected prepareRequest() {
        this.request.open(this.method, this.createRequestURI(), true);
        this.request.timeout = this.timeoutMillis;
    }

    protected abstract createRequestURI(): string;
}
