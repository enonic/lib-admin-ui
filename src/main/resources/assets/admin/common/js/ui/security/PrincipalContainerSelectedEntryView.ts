import {PrincipalContainer} from './PrincipalContainer';
import {PrincipalViewer} from './PrincipalViewer';

export class PrincipalContainerSelectedEntryView<T extends PrincipalContainer>
    extends PrincipalViewer {

    protected item: T;

    protected valueChangedListeners: ((item: T) => void)[] = [];

    constructor(item: T, readonly: boolean = false) {
        super('selected-option access-control-entry');

        this.item = item;
        this.setEditable(!readonly);

        this.setItem(this.item);
    }

    public setItem(item: T) {
        this.item = item;
    }

    getValueChangedListeners(): ((item: T) => void)[] {
        return this.valueChangedListeners;
    }

    onValueChanged(listener: (item: T) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (item: T) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyValueChanged(item: T) {
        this.valueChangedListeners.forEach((listener) => {
            listener(item);
        });
    }

    public getItem(): T {
        throw new Error('Must be implemented by inheritor');
    }
}
