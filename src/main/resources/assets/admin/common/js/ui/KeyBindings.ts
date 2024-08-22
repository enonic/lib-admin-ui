import {KeyBinding, KeyBindingAction} from './KeyBinding';
import * as Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import {Store} from '../store/Store';

export const KEY_BINDINGS_KEY = 'keyBindings';

export class KeyBindings {

    private debug: boolean = false;

    private instance: number;

    private activeBindings: Map<string, KeyBinding>;

    private shelves: Map<string, KeyBinding>[];

    private helpKeyPressedListeners: ((event: Mousetrap.ExtendedKeyboardEvent) => void)[];

    private constructor() {
        if (this.debug) {
            console.log('KeyBindings constructed instance #' + this.instance);
        }
        this.activeBindings = new Map();
        this.shelves = [];
        this.helpKeyPressedListeners = [];
        this.initializeHelpKey();
    }

    static get(): KeyBindings {
        let instance: KeyBindings = Store.instance().get(KEY_BINDINGS_KEY);

        if (instance == null) {
            instance = new KeyBindings();
            Store.instance().set(KEY_BINDINGS_KEY, instance);
        }

        return instance;
    }

    public bindKeys(bindings: KeyBinding[]) {
        let logMessage = 'Binded keys: [';
        bindings.forEach((binding: KeyBinding) => {
            this.bindKey(binding);
            logMessage += `'${binding.getCombination()}' ,`;
        });
        logMessage += ']';
        if (this.debug) {
            console.log('KeyBindings[#' + this.instance + '].bindKeys(): ' + logMessage);
        }
    }

    public bindKey(binding: KeyBinding) {
        if (binding.isGlobal()) {
            Mousetrap.bindGlobal(binding.getCombination(), binding.getCallback(),
                binding.getAction() ? KeyBindingAction[binding.getAction()].toLowerCase() : '');
        } else {
            Mousetrap.bind(binding.getCombination(), binding.getCallback(),
                binding.getAction() ? KeyBindingAction[binding.getAction()].toLowerCase() : '');
        }
        let bindingKey = this.getBindingKey(binding);
        this.activeBindings.set(bindingKey, binding);
    }

    public unbindKeys(bindings: KeyBinding[]) {

        let logMessage = 'Binded keys: [';

        bindings.forEach((binding: KeyBinding) => {
            this.unbindKey(binding);
            logMessage += `'${binding.getCombination()}' ,`;
        });
        if (this.debug) {
            console.log('KeyBindings[#' + this.instance + '].unbindKeys(): ' + logMessage);
        }
    }

    public unbindKey(binding: KeyBinding) {

        Mousetrap.unbind(binding.getCombination());
        this.activeBindings.delete(this.getBindingKey(binding));
    }

    public trigger(combination: string, action?: string) {

        Mousetrap.trigger(combination, action);
    }

    public reset() {
        if (this.debug) {
            console.log('KeyBindings[#' + this.instance + '].reset()');
        }

        Mousetrap.reset();
        this.activeBindings.clear();
        this.shelves = [];
    }

    public getActiveBindings(): KeyBinding[] {
        return this.toArray(this.activeBindings);
    }

    /*
     * Stores the current bindings on a new shelf and resets.
     */
    public shelveBindings(keyBindings: KeyBinding[] = []) {
        if (this.debug) {
            console.log('KeyBindings[#' + this.instance + '].shelveBindings(): ');
        }
        if (keyBindings.length === 0) {
            Mousetrap.reset();

            this.shelves.push(this.activeBindings);
            this.activeBindings = new Map();
        } else {
            let curBindings = new Map<string, KeyBinding>();

            keyBindings.forEach(binding => {
                if (this.activeBindings.get(this.getBindingKey(binding))) {
                    curBindings.set(this.getBindingKey(binding), this.activeBindings.get(this.getBindingKey(binding)));
                }
            });

            if (curBindings.size > 0) {
                this.unbindKeys(this.toArray(curBindings));
                this.shelves.push(curBindings);
            }
        }
    }

    /*
     * Resets current bindings and re-binds those from the last shelf.
     */
    public unshelveBindings(keyBindings: KeyBinding[] = []) {

        if (this.shelves.length === 0) {
            if (this.debug) {
                console.log('KeyBindings[#' + this.instance + '].unshelveBindings(): nothing to unshelve');
            }
            return;
        }
        const previousMousetraps: Map<string, KeyBinding> = this.shelves[this.shelves.length - 1];

        if (this.debug) {
            console.log('KeyBindings[#' + this.instance + '].unshelveBindings(): unshelving... ');
        }
        if (keyBindings.length === 0) {

            this.activeBindings.clear();
            Mousetrap.reset();

            const previousBindings: KeyBinding[] = this.toArray(previousMousetraps);

            previousBindings.forEach((previousBinding) => {
                this.bindKey(previousBinding);
            });

            this.shelves.pop();
        } else {
            const keys = keyBindings.map(binding => this.getBindingKey(binding));

            const previousKeys: string[] = [];
            previousMousetraps.forEach((_value: KeyBinding, key: string) => {
                previousKeys.push(key);
            });

            previousKeys.forEach((previousKey) => {
                if (keys.indexOf(previousKey) >= 0) {
                    this.bindKey(previousMousetraps.get(previousKey));
                    previousMousetraps.delete(previousKey);
                }
            });
            if (previousMousetraps.size === 0) {
                this.shelves.pop();
            }
        }
    }

    isActive(keyBinding: KeyBinding) {
        const activeBindings: KeyBinding[] = this.toArray(this.activeBindings);

        return activeBindings.some((curBinding: KeyBinding) => {
            return curBinding === keyBinding;
        });
    }

    onHelpKeyPressed(listener: (event: Mousetrap.ExtendedKeyboardEvent) => void) {
        this.helpKeyPressedListeners.push(listener);
    }

    unHelpKeyPressed(listener: (event: Mousetrap.ExtendedKeyboardEvent) => void) {
        this.helpKeyPressedListeners =
            this.helpKeyPressedListeners.filter((currentListener: (event: Mousetrap.ExtendedKeyboardEvent) => void) => {
                return listener !== currentListener;
            });
    }

    private getBindingKey(binding: KeyBinding): string {
        return binding.getAction()
               ? binding.getCombination() + '-' + binding.getAction()
               : binding.getCombination();
    }

    private initializeHelpKey() {
        this.bindKey(new KeyBinding('f2', (e: Mousetrap.ExtendedKeyboardEvent) => {
            this.notifyHelpKeyPressed(e);
        }).setGlobal(true).setAction(KeyBindingAction.KEYDOWN));

        this.bindKey(new KeyBinding('f2', (e: Mousetrap.ExtendedKeyboardEvent) => {
            this.notifyHelpKeyPressed(e);
        }).setGlobal(true).setAction(KeyBindingAction.KEYUP));
    }

    private notifyHelpKeyPressed(e: Mousetrap.ExtendedKeyboardEvent) {
        this.helpKeyPressedListeners.forEach((listener: (event: Mousetrap.ExtendedKeyboardEvent) => void) => {
            listener.call(this, e);
        });
    }

    private toArray(bindings: Map<string, KeyBinding>): KeyBinding[] {
        const result: KeyBinding[] = [];

        bindings.forEach((value: KeyBinding) => {
            result.push(value);
        });

        return result;
    }
}
