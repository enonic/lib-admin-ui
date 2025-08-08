import Q from 'q';
import {Element} from '../../../dom/Element';

export abstract class DialogStep {

    private dataChangedListeners: (() => void)[] = [];

    isValid(): Q.Promise<boolean> {
        return Q.resolve(true);
    }

    getData(): object {
        return null;
    }

    hasData(): boolean {
        return !!this.getData();
    }

    isOptional(): boolean {
        return false;
    }

    abstract getName(): string;

    getDescription(): string {
        return null;
    }

    abstract getHtmlEl(): Element;

    onDataChanged(listener: () => void): void {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void): void {
        this.dataChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    protected notifyDataChanged(): void {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}
