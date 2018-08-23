module api.util.loader {

    import LoadedDataEvent = api.util.loader.event.LoadedDataEvent;
    import LoadingDataEvent = api.util.loader.event.LoadingDataEvent;
    import LoaderErrorEvent = api.util.loader.event.LoaderErrorEvent;

    enum LoaderStatus {
        NOT_STARTED,
        LOADING,
        LOADED,
        PRE_LOADED
    }

    export class BaseLoader<JSON, OBJECT> {

        protected request: api.rest.HttpRequest<OBJECT[]>;

        private status: LoaderStatus = LoaderStatus.NOT_STARTED;

        private results: OBJECT[];

        private searchString: string;

        private loadedDataListeners: { (event: LoadedDataEvent<OBJECT>): Q.Promise<any> }[] = [];

        private loadingDataListeners: { (event: LoadingDataEvent): void }[] = [];

        private loaderErrorListeners: { (event: LoaderErrorEvent): void }[] = [];

        private comparator: Comparator<OBJECT>;

        constructor(request?: api.rest.HttpRequest<OBJECT[]>) {
            this.setRequest(request || this.createRequest());
        }

        protected createRequest(): api.rest.HttpRequest<OBJECT[]> {
            throw new Error('Must be implemented in deriving classes!');
        }

        protected getRequest(): api.rest.HttpRequest<OBJECT[]> {
            return this.request;
        }

        sendRequest(): wemQ.Promise<OBJECT[]> {
            return this.request.sendAndParse();
        }

        load(postLoad: boolean = false): wemQ.Promise<OBJECT[]> {
            this.notifyLoadingData(postLoad);

            return this.sendRequest()
                .then<OBJECT[]>(this.handleLoadSuccess.bind(this, postLoad))
                .catch<OBJECT[]>(this.handleLoadError.bind(this, postLoad));
        }

        preLoad(searchString: string = ''): wemQ.Promise<OBJECT[]> {
            this.notifyLoadingData(false);

            return this.sendPreLoadRequest(searchString)
                .then<OBJECT[]>(this.handleLoadSuccess.bind(this, false))
                .catch<OBJECT[]>(this.handleLoadError.bind(this, false))
                .finally(() => this.status = LoaderStatus.PRE_LOADED);
        }

        protected sendPreLoadRequest(_searchString?: string): wemQ.Promise<OBJECT[]> {
            return this.sendRequest();
        }

        private handleLoadSuccess(postLoad: boolean = false, results: OBJECT[]): OBJECT[] {
            this.results = results;

            if (this.comparator) {
                try {
                    this.results = results.sort(this.comparator.compare);
                } catch (e) {
                    console.error('Error sorting loaded elements with ' + api.ClassHelper.getClassName(this.comparator) + ': ', e);
                }
            }
            this.notifyLoadedData(results, postLoad);

            return results;
        }

        private handleLoadError(postLoad: boolean = false, error: any): OBJECT[] {
            let isObj = typeof error === 'object';
            let textMessage = isObj ? (error['message'] || 'Unknown error') : String(error);
            let statusCode = isObj && error['statusCode'] ? error['statusCode'] : 500;

            this.notifyErrorOccurred(statusCode, 'Service error: ' + textMessage, postLoad);

            return [];
        }

        isLoading(): boolean {
            return this.status === LoaderStatus.LOADING;
        }

        isLoaded(): boolean {
            return this.status === LoaderStatus.LOADED;
        }

        isNotStarted(): boolean {
            return this.status === LoaderStatus.NOT_STARTED;
        }

        isPreLoaded(): boolean {
            return this.status === LoaderStatus.PRE_LOADED;
        }

        setComparator(comparator: Comparator<OBJECT>): BaseLoader<JSON, OBJECT> {
            this.comparator = comparator;
            return this;
        }

        setRequest(request: api.rest.HttpRequest<OBJECT[]>) {
            this.request = request;
        }

        search(searchString: string): wemQ.Promise<OBJECT[]> {

            this.searchString = searchString;

            if (this.results) {
                let filtered = this.results.filter(this.filterFn, this);
                this.notifyLoadedData(filtered);
                return wemQ(this.results);
            }
            return wemQ([]);
        }

        getResults(): OBJECT[] {
            return this.results;
        }

        setResults(results: OBJECT[]) {
            this.results = results;
        }

        getComparator(): Comparator<OBJECT> {
            return this.comparator;
        }

        setSearchString(value: string) {
            this.searchString = value;
        }

        getSearchString(): string {
            return this.searchString;
        }

        filterFn(_result: OBJECT): boolean {
            throw Error('must be implemented');
        }

        notifyLoadedData(results: OBJECT[], postLoad?: boolean, silent: boolean = false) {
            this.status = LoaderStatus.LOADED;
            if (!silent) {
                const evt = new LoadedDataEvent<OBJECT>(results, postLoad);
                this.loadedDataListeners.reduce((prev, curr) => {
                    return wemQ.when(prev, () => curr(evt));
                }, wemQ(null)).catch(this.handleLoadError.bind(this, false));
            }
        }

        notifyLoadingData(postLoad?: boolean, silent: boolean = false) {
            this.status = LoaderStatus.LOADING;
            if (!silent) {
                this.loadingDataListeners.forEach((listener: (event: LoadingDataEvent) => void) => {
                    listener.call(this, new LoadingDataEvent(postLoad));
                });
            }
        }

        onLoadedData(listener: (event: LoadedDataEvent<OBJECT>) => Q.Promise<any>) {
            this.loadedDataListeners.push(listener);
        }

        onLoadingData(listener: (event: LoadingDataEvent) => void) {
            this.loadingDataListeners.push(listener);
        }

        unLoadedData(listener: (event: LoadedDataEvent<OBJECT>) => Q.Promise<any>) {
            this.loadedDataListeners = this.loadedDataListeners.filter((currentListener: (event: LoadedDataEvent<OBJECT>) => void) => {
                return currentListener !== listener;
            });
        }

        unLoadingData(listener: (event: LoadingDataEvent) => void) {
            this.loadingDataListeners = this.loadingDataListeners.filter((currentListener: (event: LoadingDataEvent) => void) => {
                return currentListener !== listener;
            });
        }

        onErrorOccurred(listener: (event: LoaderErrorEvent) => void) {
            this.loaderErrorListeners.push(listener);
        }

        unErrorOccurred(listener: (event: LoaderErrorEvent) => void) {
            this.loaderErrorListeners = this.loaderErrorListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        notifyErrorOccurred(statusCode: number, textStatus: string, postLoad?: boolean) {
            let error = new LoaderErrorEvent(statusCode, textStatus, postLoad);
            this.loaderErrorListeners.forEach((listener) => {
                listener(error);
            });
        }
    }
}
