import {IDentifiable} from '../../IDentifiable';

export enum DataChangedType {
    ADDED,
    UPDATED,
    DELETED
}

export class DataChangedEvent<DATA> {

    private readonly items: DATA[];

    private readonly type: DataChangedType;

    constructor(dataItems: DATA[], action: DataChangedType) {
        this.items = dataItems;
        this.type = action;
    }

    public getItems(): DATA[] {
        return this.items;
    }

    public getType(): DataChangedType {
        return this.type;
    }

}
