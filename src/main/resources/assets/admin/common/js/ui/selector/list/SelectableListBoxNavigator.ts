import {Element} from '../../../dom/Element';
import {KeyBinding} from '../../KeyBinding';
import {ExtendedKeyboardEvent} from 'mousetrap';
import {KeyBindings} from '../../KeyBindings';
import {ListBox} from './ListBox';

export class SelectableListBoxNavigator<I> {
    protected readonly itemsWrappers = new Map<string, Element[]>();
    protected readonly listBox: ListBox<I>;
    protected keysBound: boolean;
    protected isShowListBoxEvent: boolean

    protected clickOutsideHandler?: (e: ExtendedKeyboardEvent) => boolean;
    protected enterKeyHandler?: (e: ExtendedKeyboardEvent) => boolean;
    protected leftKeyHandler?: (e: ExtendedKeyboardEvent) => boolean;
    protected rightKeyHandler?: (e: ExtendedKeyboardEvent) => boolean;
    protected spaceKeyHandler?: (e: ExtendedKeyboardEvent) => boolean;
    protected downKeyHandler?: (e: ExtendedKeyboardEvent) => boolean;
    protected upKeyHandler?: (e: ExtendedKeyboardEvent) => boolean;

    constructor(listBox: ListBox<I>, itemsWrappers: Map<string, Element[]>) {
        this.listBox = listBox;
        this.itemsWrappers = itemsWrappers;
        this.addKeyboardNavigation();
    }

    getFocusedView(): Element {
        let focusedView = null;

        this.itemsWrappers.forEach((itemWrappers: Element[], key: string) => {
            itemWrappers.forEach((itemWrapper: Element) => {
                const elemToCheck: HTMLElement = itemWrapper.getHTMLElement();

                if (elemToCheck === document.activeElement) {
                    focusedView = itemWrapper;
                }
            });
        });

        return focusedView;
    }

    private addTabIndexesToWrappers(): void {
        this.itemsWrappers.forEach((itemWrappers: Element[], key: string) => {
            itemWrappers.forEach((itemWrapper: Element) => {
                itemWrapper.setTabIndex(0);
            });
        });
    }

    private removeTabIndexesFromWrappers(): void {
        this.itemsWrappers.forEach((itemWrappers: Element[], key: string) => {
            itemWrappers.forEach((itemWrapper: Element) => {
                itemWrapper.getEl().removeAttribute('tabindex');
            });
        });
    }

    protected addKeyboardNavigation(): void {
        this.isShowListBoxEvent = false;

        const navigationKeyBindings = [
            new KeyBinding('esc').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.clickOutsideHandler ? this.clickOutsideHandler(e) : true;
            }),
            new KeyBinding('up').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.upKeyHandler ? this.upKeyHandler(e) : this.handleUpKeyDefault(e);
            }),
            new KeyBinding('down').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.downKeyHandler ? this.downKeyHandler(e) : this.handleDownKeyDefault(e);
            }),
            new KeyBinding('enter').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.enterKeyHandler ? this.enterKeyHandler(e) : true;
            }),
            new KeyBinding('space').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.spaceKeyHandler ? this.spaceKeyHandler(e) : true;
            }),
            new KeyBinding('left').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.leftKeyHandler ? this.leftKeyHandler(e) : true;
            }),
            new KeyBinding('right').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                return this.rightKeyHandler ? this.rightKeyHandler(e) : true;
            }),
        ];

        this.listBox.onShown(() => {
            this.isShowListBoxEvent = true;

            if (!this.keysBound) {
                KeyBindings.get().shelveBindings();
                KeyBindings.get().bindKeys(navigationKeyBindings);
                this.addTabIndexesToWrappers();
            }

            this.keysBound = true;

            setTimeout(() => { // if open by arrow key then wait for event to finish
                this.isShowListBoxEvent = false;
            }, 1);
        });

        this.listBox.onHidden(() => {
            if (this.keysBound) {
                KeyBindings.get().unbindKeys(navigationKeyBindings);
                KeyBindings.get().unshelveBindings();
                this.removeTabIndexesFromWrappers();
            }

            this.keysBound = false;

        });
    }

    getFocusedItem(): I {
        let focusedItem: I = null;

        this.itemsWrappers.forEach((itemWrappers: Element[], key: string) => {
            itemWrappers.forEach((itemWrapper: Element) => {
                const elemToCheck: HTMLElement = itemWrapper.getHTMLElement();

                if (elemToCheck === document.activeElement) {
                    focusedItem = this.listBox.getItem(key);
                }
            });
        });

        return focusedItem;
    }

    protected handleDownKeyDefault(e: ExtendedKeyboardEvent): boolean {
        if (!this.isShowListBoxEvent) {
            const focusedView = this.getFocusedView();

            if (focusedView) {
                const tabbable = this.listBox.getTabbableElements().map(tabbable => tabbable.getHTMLElement());
                const index = tabbable.indexOf(focusedView.getHTMLElement());
                if (index >= 0) {
                    const next = tabbable[index + 1];

                    if (next) {
                        next?.focus();
                    } else {
                        tabbable[0]?.focus();
                    }
                }
            } else {
                this.listBox.getTabbableElements()[0]?.getHTMLElement().focus();
            }
        }

        return false;
    }

    protected handleUpKeyDefault(e: ExtendedKeyboardEvent): boolean {
        e.stopPropagation();
        const focusedView = this.getFocusedView();

        if (focusedView) {
            const tabbable = this.listBox.getTabbableElements().map(tabbable => tabbable.getHTMLElement());
            const index = tabbable.indexOf(focusedView.getHTMLElement());
            if (index >= 0) {
                if (index === 0) {
                    tabbable[tabbable.length - 1]?.focus();
                } else {
                    tabbable[index - 1]?.focus();
                }
            }
        }

        return false;
    }

    notifyItemWrapperAdded(itemWrapper: Element): void {
        if (this.keysBound) {
            itemWrapper.setTabIndex(0);
        }
    }

    setClickOutsideHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.clickOutsideHandler = handler;
        return this;
    }

    setEnterKeyHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.enterKeyHandler = handler;
        return this;
    }

    setLeftKeyHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.leftKeyHandler = handler;
        return this;
    }

    setRightKeyHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.rightKeyHandler = handler;
        return this;
    }

    setSpaceHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.spaceKeyHandler = handler;
        return this;
    }

    setKeyDownHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.downKeyHandler = handler;
        return this;
    }

    setKeyUpHandler(handler: (e: ExtendedKeyboardEvent) => boolean): this {
        this.upKeyHandler = handler;
        return this;
    }
}
