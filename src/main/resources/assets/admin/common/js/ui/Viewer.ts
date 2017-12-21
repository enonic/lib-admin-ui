module api.ui {

    /**
     * An abstract class capable of viewing a given object.
     */
    export class Viewer<OBJECT>
        extends api.dom.Element {

        private editable: boolean = true;
        private object: OBJECT;
        private removeButton: api.dom.AEl;
        private removeClickedListeners: { (event: MouseEvent): void }[] = [];
        protected className: string;

        constructor(className?: string) {
            super(new api.dom.NewElementBuilder().setTagName('div').setClassName('viewer ' + (className || '')).setGenerateId(false));

            this.className = className;
        }

        doRender(): Q.Promise<boolean> {
            return super.doRender().then((rendered) => {
                this.doLayout(this.getObject());
                return rendered;
            });
        }

        /*
         Need a sync method (instead of async doRender) to use in grid formatters which use viewer.toString()
         */
        protected doLayout(_object: OBJECT) {
            // may be implemented in children
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

        getPreferredHeight(): number {
            throw new Error('Must be implemented by inheritors');
        }

        clone(): Viewer<OBJECT> {
            return new (<any>this.constructor)(...this.getCloneArgs());
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
            this.removeButton = new api.dom.AEl('remove');
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

        private notifyRemoveClicked(event: MouseEvent) {
            this.removeClickedListeners.forEach((listener) => {
                listener(event);
            });
        }
    }
}
