import * as Q from 'q';
import {LoadedDataEvent} from './event/LoadedDataEvent';
import {LoadingDataEvent} from './event/LoadingDataEvent';
import {LoaderErrorEvent} from './event/LoaderErrorEvent';
import {HttpRequest} from '../../rest/HttpRequest';
import {ClassHelper} from '../../ClassHelper';
import {Comparator} from '../../Comparator';

enum LoaderStatus {
    NOT_STARTED,
    LOADING,
    LOADED,
    PRE_LOADED
}

export class BaseLoader<OBJECT> {

    protected request: HttpRequest<OBJECT[]>;

    private status: LoaderStatus = LoaderStatus.NOT_STARTED;

    private results: OBJECT[];

    private searchString: string;

    private loadedDataListeners: { (event: LoadedDataEvent<OBJECT>): Q.Promise<any> }[] = [];

    private loadingDataListeners: { (event: LoadingDataEvent): void }[] = [];

    private loaderErrorListeners: { (event: LoaderErrorEvent): void }[] = [];

    private comparator: Comparator<OBJECT>;

    private usePreData: boolean = false;

    constructor(request?: HttpRequest<OBJECT[]>) {
        this.setRequest(request || this.createRequest());
    }

    sendRequest(): Q.Promise<OBJECT[]> {
        return this.request.sendAndParse();
    }

    load(postLoad: boolean = false): Q.Promise<OBJECT[]> {
        this.notifyLoadingData(postLoad);

        return this.sendRequest()
            .then<OBJECT[]>(this.handleLoadSuccess.bind(this, postLoad))
            .catch<OBJECT[]>(this.handleLoadError.bind(this, postLoad));
    }

    preLoad(searchString: string = ''): Q.Promise<OBJECT[]> {
        this.notifyLoadingData(false);

        let promise: Q.Promise<OBJECT[]>;

        if(this.usePreData) {
            promise = this.preData(searchString);
        } else {
            promise = this.sendPreLoadRequest(searchString);
        }

        return promise
            .then<OBJECT[]>(this.handleLoadSuccess.bind(this, false))
            .catch<OBJECT[]>(this.handleLoadError.bind(this, false))
            .finally(() => this.status = LoaderStatus.PRE_LOADED);
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

    setComparator(comparator: Comparator<OBJECT>): BaseLoader<OBJECT> {
        this.comparator = comparator;
        return this;
    }

    setRequest(request: HttpRequest<OBJECT[]>) {
        this.request = request;
    }

    search(searchString: string): Q.Promise<OBJECT[]> {
        this.searchString = searchString;

        const searchResult: OBJECT[] = this.results ? this.results.filter(this.filterFn, this) : [];

        if (searchResult.length < this.results?.length) {
            this.notifyLoadedData(searchResult);
        }

        return Q(searchResult);
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
                return Q.when(prev, () => curr(evt));
            }, Q(null)).catch(this.handleLoadError.bind(this, false));
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

    setUsePreData(bool: boolean) {
        this.usePreData = bool;
        return this;
    }

    preData(searchString: string): Q.Promise<OBJECT[]> {
        throw new Error('Must be implemented in deriving classes!');
    }

    protected createRequest(): HttpRequest<OBJECT[]> {
        throw new Error('Must be implemented in deriving classes!');
    }

    protected getRequest(): HttpRequest<OBJECT[]> {
        return this.request;
    }

    protected sendPreLoadRequest(_searchString?: string): Q.Promise<OBJECT[]> {
        return this.sendRequest();
    }

    private handleLoadSuccess(postLoad: boolean = false, results: OBJECT[]): OBJECT[] {
        this.results = results;

        if (this.comparator) {
            try {
                this.results = results.sort(this.comparator.compare);
            } catch (e) {
                console.error('Error sorting loaded elements with ' + ClassHelper.getClassName(this.comparator) + ': ', e);
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
}
