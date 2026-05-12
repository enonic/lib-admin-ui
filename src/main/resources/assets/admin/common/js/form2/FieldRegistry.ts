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
};

export class FieldRegistry {
    private readonly handles = new Map<string, FieldHandle>();

    /**
     * Register a field handle under a property path. Returns an unregister function;
     * use it in cleanup to drop the handle when the field unmounts.
     *
     * Re-registering the same path replaces the previous handle — last writer wins.
     * This is intentional: a single mounted instance per path is the expected case.
     */
    register(path: string, handle: FieldHandle): () => void {
        this.handles.set(path, handle);
        return () => {
            // Guard against unregistering a stale handle after a re-register replaced it.
            if (this.handles.get(path) === handle) {
                this.handles.delete(path);
            }
        };
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

    /** Returns the current occurrence IDs for a registered field, or `undefined` if the path isn't registered. */
    getOccurrenceIds(path: string): string[] | undefined {
        return this.handles.get(path)?.getOccurrenceIds();
    }

    hasField(path: string): boolean {
        return this.handles.has(path);
    }
}
