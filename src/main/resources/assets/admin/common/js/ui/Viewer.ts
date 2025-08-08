import Q from 'q';
import {AEl} from '../dom/AEl';
import {Element, NewElementBuilder} from '../dom/Element';

/**
 * An abstract class capable of viewing a given object.
 */
export class Viewer<OBJECT>
    extends Element {

    protected className: string;
    private editable: boolean = true;
    private object: OBJECT;
    private removeButton: AEl;
    private removeClickedListeners: ((event: MouseEvent) => void)[] = [];

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('div').setClassName('viewer ' + (className || '')).setGenerateId(false));

        this.className = className;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.doLayout(this.getObject());
            return rendered;
        });
    }

    setObject(object: OBJECT) {
        this.object = object;

        if (this.isRendered()) {
            return this.doLayout(object);
        }
    }

    getObject(): OBJECT {
        return this.object;
    }

    clone(): Viewer<OBJECT> {
        return new (this.constructor as any)(...this.getCloneArgs());
    }

    /**
     * Override to provide additional arguments to clone constructor
     * @returns {any[]}
     */
    getCloneArgs(): any[] {
        return [this.className];
    }

    toString(): string {
        if (!this.isRendered()) {
            this.doLayout(this.getObject());
        }
        return super.toString();
    }

    setReadonly(readonly: boolean) {
        this.setEditable(!readonly);
        this.toggleClass('readonly', readonly);
    }

    setEditable(editable: boolean) {
        this.editable = editable;
    }

    isEditable(): boolean {
        return this.editable;
    }

    appendRemoveButton() {
        if (!this.editable || this.removeButton) {
            return;
        }
        this.removeButton = new AEl('remove');
        this.removeButton.onClicked((event: MouseEvent) => {
            if (this.editable) {
                this.notifyRemoveClicked(event);
            }
            event.stopPropagation();
            event.preventDefault();
            return false;
        });
        this.appendChild(this.removeButton);
    }

    onRemoveClicked(listener: (event: MouseEvent) => void) {
        this.removeClickedListeners.push(listener);
    }

    unRemoveClicked(listener: (event: MouseEvent) => void) {
        this.removeClickedListeners = this.removeClickedListeners.filter((current) => {
            return current !== listener;
        });
    }

    /*
     Need a sync method (instead of async doRender) to use in grid formatters which use viewer.toString()
     */
    protected doLayout(_object: OBJECT) {
        // may be implemented in children
    }

    private notifyRemoveClicked(event: MouseEvent) {
        this.removeClickedListeners.forEach((listener) => {
            listener(event);
        });
    }
}
