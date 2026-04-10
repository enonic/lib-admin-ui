/**
 * Applies Mousetrap's global-bind plugin directly to the Mousetrap default instance.
 * The original plugin (mousetrap/plugins/global-bind) relies on Mousetrap being a
 * window global, which doesn't work with ES module bundling. This module inlines
 * the same logic using the ES module import.
 */
import Mousetrap from 'mousetrap';

declare module 'mousetrap' {
    interface MousetrapStatic {
        bindGlobal(
            keys: string | string[],
            callback: (e: Mousetrap.ExtendedKeyboardEvent, combo: string) => void,
            action?: string,
        ): void;
    }
}

const _globalCallbacks: Record<string, boolean> = {};
const _originalStopCallback = Mousetrap.prototype.stopCallback;

Mousetrap.prototype.stopCallback = function (
    e: KeyboardEvent,
    element: Element,
    combo: string,
    sequence?: string,
): boolean {
    if (this.paused) {
        return true;
    }

    if (_globalCallbacks[combo] || (sequence && _globalCallbacks[sequence])) {
        return false;
    }

    return _originalStopCallback.call(this, e, element, combo, sequence);
};

Mousetrap.bindGlobal = function (
    keys: string | string[],
    callback: (e: Mousetrap.ExtendedKeyboardEvent, combo: string) => void,
    action?: string,
): void {
    Mousetrap.bind(keys, callback, action);

    if (keys instanceof Array) {
        for (const key of keys) {
            _globalCallbacks[key] = true;
        }
        return;
    }

    _globalCallbacks[keys] = true;
};
