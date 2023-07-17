export class KeyEventsHandler {

    private backspaceListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private tabListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private enterListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private escapeListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private spaceListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private upListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private leftListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private rightListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private downListeners: ((e: KeyboardEvent) => boolean)[] = [];
    private keyListeners: ((e: KeyboardEvent) => boolean)[] = [];

    onBackspace(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.backspaceListeners, listener);
    }

    onTab(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.tabListeners, listener);
    }

    onEnter(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.enterListeners, listener);
    }

    onEscape(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.escapeListeners, listener);
    }

    onSpace(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.spaceListeners, listener);
    }

    onUp(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.upListeners, listener);
    }

    onLeft(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.leftListeners, listener);
    }

    onRight(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.rightListeners, listener);
    }

    onDown(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.downListeners, listener);
    }

    onKey(listener: (event: KeyboardEvent) => boolean): KeyEventsHandler {
        return this.push(this.keyListeners, listener);
    }

    handle(event: KeyboardEvent): boolean {
        switch (event.which) {
        case 8: // Backspace
            return this.notify(this.backspaceListeners, event);
        case 9: // Tab
            return this.notify(this.tabListeners, event);
        case 13: // Enter
            return this.notify(this.enterListeners, event);
        case 27: // Esc
            return this.notify(this.escapeListeners, event);
        case 32: // Spacebar
            return this.notify(this.spaceListeners, event);
        case 37: // Left
            return this.notify(this.leftListeners, event);
        case 38: // Up
            return this.notify(this.upListeners, event);
        case 39: // Right
            return this.notify(this.rightListeners, event);
        case 40: // Down
            return this.notify(this.downListeners, event);
        default:
            return this.notify(this.keyListeners, event);
        }
    }

    private push(listeners: ((e: KeyboardEvent) => boolean)[], listener: (e: KeyboardEvent) => boolean): KeyEventsHandler {
        listeners.push(listener);
        return this;
    }

    private notify(listeners: ((e: KeyboardEvent) => boolean)[], e: KeyboardEvent): boolean {
        return listeners.reduce((handled, listener) => {
            return listener(e) || handled;
        }, false);
    }
}
