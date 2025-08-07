import Q from 'q';
import {PostLoader} from '../../util/loader/PostLoader';

export abstract class OptionDataLoader<DATA>
    extends PostLoader<DATA> {

    abstract checkReadonly(options: DATA[]): Q.Promise<string[]>;

    abstract onLoadModeChanged(listener: (isTreeMode: boolean) => void);

    abstract unLoadModeChanged(listener: (isTreeMode: boolean) => void);
}

export class OptionDataLoaderData<DATA> {

    private data: DATA[];
    private hits: number;
    private totalHits: number;

    constructor(data: DATA[], hits?: number, totalHits?: number) {
        this.data = data;
        this.hits = hits;
        this.totalHits = totalHits;
    }

    public getData(): DATA[] {
        return this.data;
    }

    public getHits(): number {
        return this.hits;
    }

    public getTotalHits(): number {
        return this.totalHits;
    }
}
