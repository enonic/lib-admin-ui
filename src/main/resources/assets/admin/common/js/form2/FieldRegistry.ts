/**
 * Opaque ownership token returned by {@link FieldRegistry.acquireProcessing}. Callers
 * MUST treat it as opaque — no parsing, no comparison except via
 * {@link FieldRegistry.releaseProcessing}.
 */
export type ProcessingToken = string;

let processingTokenCounter = 0;

export function generateProcessingToken(): ProcessingToken {
    // crypto.randomUUID is available in all modern browsers and JSDOM 22+.
    // Fallback covers older test environments.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    processingTokenCounter += 1;
    return `pt-${Date.now()}-${processingTokenCounter}-${Math.random().toString(36).slice(2)}`;
}

export type FieldRegistration = {
    unregister: () => void;
    notifyActivePath: (path: string | undefined) => void;
};

export type RevealOptions = {focus?: boolean; scroll?: boolean};

/**
 * Routes external messages (e.g. translation failures) to specific input fields by path.
 *
 * Each {@link InputField} registers a handle keyed by its property path
 * (`input.getPath().toString()`) on mount and unregisters on unmount. External callers
 * push transient errors via {@link setTransientError} without holding refs to the
 * field components themselves.
 *
 * Occurrences are addressed by **stable ID** (from `OccurrenceManager.getIds()`), not
 * by position. Capture an ID synchronously when starting an async operation and use
 * the same ID when the operation completes — moves/removes between fire and response
 * won't cause the error to land on the wrong occurrence.
 *
 * Set/clear methods return `false` when the path is unknown OR the underlying handle
 * rejected the call (e.g. the captured occurrence ID was for a since-removed
 * occurrence). Callers can decide whether to retry, surface a different message, or
 * drop the result.
 */

export type FieldHandle = {
    setTransientError: (occurrenceId: string, message: string) => boolean;
    clearTransientError: (occurrenceId: string) => boolean;
    clearAllTransientErrors: () => void;
    /** Snapshot of current occurrence IDs at call time — use to capture a stable ID before firing async work. */
    getOccurrenceIds: () => string[];
    clearRawValues?: () => void;
    acquireProcessing: (occurrenceId: string) => ProcessingToken | null;
    releaseProcessing: (token: ProcessingToken) => boolean;
    isProcessing: (occurrenceId: string) => boolean;
    reveal: (occurrenceId?: string, options?: RevealOptions) => boolean;
    focus: (occurrenceId?: string) => boolean;
};

export class FieldRegistry {
    private readonly handles = new Map<string, FieldHandle>();
    private readonly activePathSubscribers = new Set<(path: string | undefined) => void>();
    private pendingActivePath: string | undefined = undefined;
    private hasPendingActivePath = false;
    private lastFocusOwner: string | undefined = undefined;

    /**
     * Register a field handle under a property path. Returns an object exposing
     * `unregister` and `notifyActivePath`.
     *
     * `notifyActivePath` is the only path by which active-field changes can reach
     * subscribers — it is intentionally NOT on the public `FieldRegistry` surface so
     * external consumers cannot spoof focus events.
     *
     * Re-registering the same path replaces the previous handle — last writer wins.
     */
    register(path: string, handle: FieldHandle): FieldRegistration {
        this.handles.set(path, handle);
        const unregister = (): void => {
            if (this.handles.get(path) === handle) {
                this.handles.delete(path);
            }
        };
        const notifyActivePath = (active: string | undefined): void => {
            if (active === undefined) {
                // Only the field that currently owns the active state can clear it.
                // Filters out stale blurs that arrive after another field already took
                // focus, and unmount cleanups from fields that were never active.
                if (this.lastFocusOwner !== path) return;
                this.lastFocusOwner = undefined;
            } else {
                this.lastFocusOwner = active;
            }
            this.scheduleActivePathEmit(active);
        };
        return {unregister, notifyActivePath};
    }

    setTransientError(path: string, occurrenceId: string, message: string): boolean {
        const handle = this.handles.get(path);
        if (handle == null) return false;
        return handle.setTransientError(occurrenceId, message);
    }

    clearTransientError(path: string, occurrenceId: string): boolean {
        const handle = this.handles.get(path);
        if (handle == null) return false;
        return handle.clearTransientError(occurrenceId);
    }

    /**
     * Clear all transient errors for a path, or across every registered field when
     * `path` is omitted.
     */
    clearAllTransientErrors(path?: string): void {
        if (path != null) {
            this.handles.get(path)?.clearAllTransientErrors();
            return;
        }
        this.handles.forEach(handle => {
            handle.clearAllTransientErrors();
        });
    }

    clearRawValues(path?: string): void {
        if (path != null) {
            this.handles.get(path)?.clearRawValues?.();
            return;
        }
        this.handles.forEach(handle => {
            handle.clearRawValues?.();
        });
    }

    acquireProcessing(path: string, occurrenceId: string): ProcessingToken | null {
        const handle = this.handles.get(path);
        if (handle == null) return null;
        return handle.acquireProcessing(occurrenceId);
    }

    /**
     * Release a processing lock by token. Scans registered handles for the owner
     * (the token does not carry its path). Linear in the number of registered
     * fields, which is small (one InputField per visible path).
     */
    releaseProcessing(token: ProcessingToken): boolean {
        for (const handle of this.handles.values()) {
            if (handle.releaseProcessing(token)) return true;
        }
        return false;
    }

    isProcessing(path: string, occurrenceId: string): boolean {
        const handle = this.handles.get(path);
        if (handle == null) return false;
        return handle.isProcessing(occurrenceId);
    }

    reveal(path: string, occurrenceId?: string, options?: RevealOptions): boolean {
        const handle = this.handles.get(path);
        if (handle == null) return false;
        return handle.reveal(occurrenceId, options);
    }

    focus(path: string, occurrenceId?: string): boolean {
        const handle = this.handles.get(path);
        if (handle == null) return false;
        return handle.focus(occurrenceId);
    }

    /** Returns the current occurrence IDs for a registered field, or `undefined` if the path isn't registered. */
    getOccurrenceIds(path: string): string[] | undefined {
        return this.handles.get(path)?.getOccurrenceIds();
    }

    hasField(path: string): boolean {
        return this.handles.has(path);
    }

    subscribeActivePath(handler: (path: string | undefined) => void): () => void {
        this.activePathSubscribers.add(handler);
        return () => {
            this.activePathSubscribers.delete(handler);
        };
    }

    private scheduleActivePathEmit(active: string | undefined): void {
        this.pendingActivePath = active;
        if (this.hasPendingActivePath) return;
        this.hasPendingActivePath = true;
        queueMicrotask(() => {
            const value = this.pendingActivePath;
            this.hasPendingActivePath = false;
            this.pendingActivePath = undefined;
            this.activePathSubscribers.forEach(handler => {
                try {
                    handler(value);
                } catch (error) {
                    console.error('FieldRegistry: active-path subscriber threw', error);
                }
            });
        });
    }
}
