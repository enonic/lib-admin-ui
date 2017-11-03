module api.rest {

    import UriHelper = api.util.UriHelper;

    export class JsonRequest<RAW_JSON_TYPE> {

        private path: Path;

        private method: string = 'GET';

        private params: Object;

        private timeoutMillis: number = 10000;

        private async: boolean = true;

        setPath(value: Path): JsonRequest<RAW_JSON_TYPE> {
            this.path = value;
            return this;
        }

        setMethod(value: string): JsonRequest<RAW_JSON_TYPE> {
            this.method = value;
            return this;
        }

        setParams(params: Object): JsonRequest<RAW_JSON_TYPE> {
            this.params = params;
            return this;
        }

        setTimeout(timeoutMillis: number): JsonRequest<RAW_JSON_TYPE> {
            this.timeoutMillis = timeoutMillis;
            return this;
        }

        setAsync(async: boolean): JsonRequest<RAW_JSON_TYPE> {
            this.async = async;
            return this;
        }

        send(): wemQ.Promise<JsonResponse<RAW_JSON_TYPE>> {

            let deferred = wemQ.defer<JsonResponse<RAW_JSON_TYPE>>();

            let request: XMLHttpRequest = new XMLHttpRequest();

            request.onreadystatechange = () => {

                if (request.readyState === 4) {
                    let errorJson = null;

                    if (request.status === 204) {
                        deferred.resolve(new JsonResponse<RAW_JSON_TYPE>(null));
                    } else if (request.status >= 200 && request.status < 300) {
                        deferred.resolve(new JsonResponse<RAW_JSON_TYPE>(request.response));
                    } else if (request.status === 403) {
                        deferred.reject(new api.AccessDeniedException('Access denied'));
                    } else {
                        try {
                            errorJson = request.response ? JSON.parse(request.response) : null;
                        } catch (error) {
                            deferred.reject(error);
                        }

                        deferred.reject(new RequestError(request.status, errorJson ? errorJson.message : ''));
                    }
                }
            };

            if ('POST' === this.method.toUpperCase()) {
                this.preparePOSTRequest(request);
                let paramString = JSON.stringify(this.params);
                request.send(paramString);
            } else {
                this.prepareGETRequest(request).send();
            }

            return deferred.promise;
        }

        private prepareGETRequest(request: XMLHttpRequest) {
            let uriString = UriHelper.appendUrlParams(this.path.toString(), this.params);
            request.open(this.method, UriHelper.getUri(uriString), this.async);
            if (this.async) {
                request.timeout = this.timeoutMillis;
            }
            request.setRequestHeader('Accept', 'application/json');
            if (api.BrowserHelper.isIE()) {
                request.setRequestHeader('Pragma', 'no-cache');
                request.setRequestHeader('Cache-Control', 'no-cache');
            }
            return request;
        }

        private preparePOSTRequest(request: XMLHttpRequest) {
            request.open(this.method, UriHelper.getUri(this.path.toString()), this.async);
            if (this.async) {
                request.timeout = this.timeoutMillis;
            }
            request.setRequestHeader('Accept', 'application/json');
            request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        }
    }
}
