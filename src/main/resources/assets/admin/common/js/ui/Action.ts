import * as Q from 'q';
import {KeyBinding} from './KeyBinding';
import {Mnemonic} from './Mnemonic';
import {IWCAG} from './WCAG';
import {ObjectHelper} from '../ObjectHelper';

type ExecutionListener = (action: Action) => Q.Promise<any> | void;

export class Action {

    protected forceExecute: boolean = false;

    private label: string;

    private title: string;

    private clazz: string;

    private iconClass: string;

    private shortcut: KeyBinding;

    private mnemonic: Mnemonic;

    private enabled: boolean = true;

    private visible: boolean = true;

    private foldable: boolean = true;

    private executionListeners: ExecutionListener[] = [];

    private propertyChangedListeners: ((action: Action) => void)[] = [];

    private childActions: Action[] = [];

    private parentAction: Action;

    private wcag?: IWCAG;

    private sortOrder: number = 10;

    private beforeExecuteListeners: ((action: Action) => void)[] = [];

    private afterExecuteListeners: ((action: Action) => void)[] = [];

    constructor(label?: string, shortcut?: string, global?: boolean) {
        this.label = label;

        if (shortcut) {
            this.shortcut = new KeyBinding(shortcut).setGlobal(global).setCallback((e: Mousetrap.ExtendedKeyboardEvent) => {

                // preventing Browser shortcuts to kick in
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    // internet explorer
                    e.returnValue = false;
                }
                this.execute();
                return false;
            });
        }
    }

    static getKeyBindings(actions: Action[]): KeyBinding[] {

        let bindings: KeyBinding[] = [];
        actions.forEach((action: Action) => {
            action.getKeyBindings().forEach((keyBinding: KeyBinding) => {
                bindings.push(keyBinding);
            });

        });
        return bindings;
    }

    setTitle(title: string) {
        this.title = title;
    }

    getTitle(): string {
        return this.title;
    }

    setSortOrder(sortOrder: number) {
        this.sortOrder = sortOrder;
    }

    getSortOrder(): number {
        return this.sortOrder;
    }

    setChildActions(actions: Action[]): Action {
        actions.forEach((action: Action) => {
            action.parentAction = this;
        });
        this.childActions = actions;

        return this;
    }

    hasChildActions(): boolean {
        return this.childActions.length > 0;
    }

    hasParentAction(): boolean {
        return !!this.parentAction;
    }

    getParentAction(): Action {
        return this.parentAction;
    }

    getChildActions(): Action[] {
        return this.childActions;
    }

    getLabel(): string {
        return this.label;
    }

    setLabel(value: string) {

        if (value !== this.label) {
            this.label = value;
            this.notifyPropertyChanged();
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    setEnabled(value: boolean): Action {

        if (value !== this.enabled) {
            this.enabled = value;
            this.notifyPropertyChanged();
        }
        return this;
    }

    isVisible(): boolean {
        return this.visible;
    }

    isFocusable(): boolean {
        return this.isVisible() && this.isEnabled();
    }

    setVisible(value: boolean): Action {
        if (value !== this.visible) {
            this.visible = value;
            this.notifyPropertyChanged();
        }
        return this;
    }

    setWcagAttributes(wcag: IWCAG): Action {
        this.wcag = wcag;
        return this;
    }

    hasWcagAttributes(): boolean {
        return ObjectHelper.isDefined(this.wcag);
    }

    getWcagAttributes(): IWCAG {
        return this.wcag;
    }

    getIconClass(): string {
        return this.iconClass;
    }

    setIconClass(value: string): Action {
        if (value !== this.iconClass) {
            this.iconClass = value;
            this.notifyPropertyChanged();
        }
        return this;
    }

    toggleIconClass(className: string, condition?: boolean): Action {
        if (condition === false || (condition == null && this.iconClass === className)) {
            this.setIconClass('');
        } else {
            this.setIconClass(className);
        }
        return this;
    }

    getClass(): string {
        return this.clazz;
    }

    setClass(value: string): Action {
        this.clazz = value;
        return this;
    }

    hasShortcut(): boolean {
        return this.shortcut != null;
    }

    getShortcut(): KeyBinding {
        return this.shortcut;
    }

    setMnemonic(value: string) {
        this.mnemonic = new Mnemonic(value);
    }

    hasMnemonic(): boolean {
        return this.mnemonic != null;
    }

    getMnemonic(): Mnemonic {
        return this.mnemonic;
    }

    isFoldable(): boolean {
        return this.foldable;
    }

    setFoldable(value: boolean): Action {
        this.foldable = value;
        return this;
    }

    execute(forceExecute: boolean = false): void {
        if (this.enabled) {
            this.notifyBeforeExecute();
            this.forceExecute = forceExecute;

            const promises = this.executionListeners.map((listener: ExecutionListener) => listener(this));

            Q.all(promises).then(() => {
                this.forceExecute = false;
                this.notifyAfterExecute();
            });

        }
    }

    onExecuted(listener: (action: Action) => Q.Promise<any> | void): Action {
        this.executionListeners.push(listener);
        return this;
    }

    unExecuted(listener: (action: Action) => Q.Promise<any> | void): Action {
        this.executionListeners = this.executionListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    onPropertyChanged(listener: (action: Action) => void) {
        this.propertyChangedListeners.push(listener);
    }

    unPropertyChanged(listener: () => void) {
        this.propertyChangedListeners = this.propertyChangedListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    onBeforeExecute(listener: (action: Action) => void) {
        this.beforeExecuteListeners.push(listener);
    }

    unBeforeExecute(listener: (action: Action) => void) {
        this.beforeExecuteListeners = this.beforeExecuteListeners.filter((currentListener: (action: Action) => void) => {
            return listener !== currentListener;
        });
    }

    onAfterExecute(listener: (action: Action) => void) {
        this.afterExecuteListeners.push(listener);
    }

    unAfterExecute(listener: (action: Action) => void) {
        this.afterExecuteListeners = this.afterExecuteListeners.filter((currentListener: (action: Action) => void) => {
            return listener !== currentListener;
        });
    }

    clearListeners() {
        this.beforeExecuteListeners = [];
        this.afterExecuteListeners = [];
    }

    getKeyBindings(): KeyBinding[] {

        let bindings: KeyBinding[] = [];

        if (this.hasShortcut()) {
            bindings.push(this.getShortcut());
        }
        if (this.hasMnemonic()) {
            bindings.push(this.getMnemonic().toKeyBinding(() => {
                this.execute();
            }));
        }

        return bindings;
    }

    private notifyPropertyChanged() {
        this.propertyChangedListeners.forEach((listener: (action: Action) => void) => listener(this));
    }

    private notifyBeforeExecute() {
        this.beforeExecuteListeners.forEach((listener: (action: Action) => void) => {
            listener(this);
        });
    }

    private notifyAfterExecute() {
        this.afterExecuteListeners.forEach((listener: (action: Action) => void) => {
            listener(this);
        });
    }
}
