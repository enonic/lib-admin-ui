import Q = require('q');
import {TreeNode} from '../treegrid/TreeNode';
import {PostLoader} from '../../util/loader/PostLoader';
import {Option} from './Option';

export abstract class OptionDataLoader<DATA>
    extends PostLoader<DATA> {

    abstract fetch(node: TreeNode<Option<DATA>>): Q.Promise<DATA>;

    abstract fetchChildren(parentNode: TreeNode<Option<DATA>>, from?: number, size?: number): Q.Promise<OptionDataLoaderData<DATA>>;

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
