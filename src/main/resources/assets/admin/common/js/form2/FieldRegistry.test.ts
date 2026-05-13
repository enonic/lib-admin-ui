import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FieldRegistry, type RevealOptions} from './FieldRegistry';

type HandleMocks = {
    setTransientError: ReturnType<typeof vi.fn<(occurrenceId: string, message: string) => boolean>>;
    clearTransientError: ReturnType<typeof vi.fn<(occurrenceId: string) => boolean>>;
    clearAllTransientErrors: ReturnType<typeof vi.fn<() => void>>;
    getOccurrenceIds: ReturnType<typeof vi.fn<() => string[]>>;
    acquireProcessing: ReturnType<typeof vi.fn<(occurrenceId: string) => string | null>>;
    releaseProcessing: ReturnType<typeof vi.fn<(token: string) => boolean>>;
    isProcessing: ReturnType<typeof vi.fn<(occurrenceId: string) => boolean>>;
    reveal: ReturnType<typeof vi.fn<(occurrenceId?: string, options?: RevealOptions) => boolean>>;
    focus: ReturnType<typeof vi.fn<(occurrenceId?: string) => boolean>>;
};

function makeHandle(): HandleMocks {
    return {
        // Default to success — individual tests override with mockReturnValueOnce when
        // they need to simulate manager-rejection (stale ID, removed occurrence).
        setTransientError: vi.fn<(occurrenceId: string, message: string) => boolean>(() => true),
        clearTransientError: vi.fn<(occurrenceId: string) => boolean>(() => true),
        clearAllTransientErrors: vi.fn<() => void>(),
        getOccurrenceIds: vi.fn<() => string[]>(() => []),
        acquireProcessing: vi.fn<(occurrenceId: string) => string | null>(() => 'token-default'),
        releaseProcessing: vi.fn<(token: string) => boolean>(() => true),
        isProcessing: vi.fn<(occurrenceId: string) => boolean>(() => false),
        reveal: vi.fn<(occurrenceId?: string, options?: RevealOptions) => boolean>(() => true),
        focus: vi.fn<(occurrenceId?: string) => boolean>(() => true),
    };
}

describe('FieldRegistry', () => {
    let registry: FieldRegistry;

    beforeEach(() => {
        registry = new FieldRegistry();
    });

    describe('register', () => {
        it('returns an object with unregister and notifyActivePath', () => {
            const handle = makeHandle();
            const result = registry.register('.foo', handle);

            expect(typeof result.unregister).toBe('function');
            expect(typeof result.notifyActivePath).toBe('function');
            expect(registry.hasField('.foo')).toBe(true);
            result.unregister();
            expect(registry.hasField('.foo')).toBe(false);
        });

        it('replaces a previously registered handle for the same path (last writer wins)', () => {
            const first = makeHandle();
            const second = makeHandle();
            registry.register('.foo', first);
            registry.register('.foo', second);

            registry.setTransientError('.foo', 'occurrence-0', 'msg');

            expect(first.setTransientError).not.toHaveBeenCalled();
            expect(second.setTransientError).toHaveBeenCalledWith('occurrence-0', 'msg');
        });

        it('stale unregister calls do not drop a replaced handle', () => {
            const first = makeHandle();
            const second = makeHandle();
            const {unregister: unregisterFirst} = registry.register('.foo', first);
            registry.register('.foo', second);

            unregisterFirst();

            expect(registry.hasField('.foo')).toBe(true);
            registry.setTransientError('.foo', 'occurrence-0', 'msg');
            expect(second.setTransientError).toHaveBeenCalledWith('occurrence-0', 'msg');
        });
    });

    describe('setTransientError', () => {
        it('routes to the matching handle and returns the handle result', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            const result = registry.setTransientError('.foo', 'occurrence-2', 'Translation failed');

            expect(result).toBe(true);
            expect(handle.setTransientError).toHaveBeenCalledWith('occurrence-2', 'Translation failed');
        });

        it('returns false and does not invoke the handle when the path is unknown', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            const result = registry.setTransientError('.bar', 'occurrence-0', 'msg');

            expect(result).toBe(false);
            expect(handle.setTransientError).not.toHaveBeenCalled();
        });

        it('propagates handle rejection (stale occurrence ID) as false', () => {
            const handle = makeHandle();
            handle.setTransientError.mockReturnValueOnce(false);
            registry.register('.foo', handle);

            // ? Simulates the manager rejecting an ID for an already-removed occurrence —
            // ? the registry must not silently report success.
            const result = registry.setTransientError('.foo', 'occurrence-stale', 'late');

            expect(result).toBe(false);
            expect(handle.setTransientError).toHaveBeenCalledWith('occurrence-stale', 'late');
        });
    });

    describe('clearTransientError', () => {
        it('routes to the matching handle and returns the handle result', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            const result = registry.clearTransientError('.foo', 'occurrence-1');

            expect(result).toBe(true);
            expect(handle.clearTransientError).toHaveBeenCalledWith('occurrence-1');
        });

        it('returns false and does not invoke the handle when the path is unknown', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            const result = registry.clearTransientError('.bar', 'occurrence-0');

            expect(result).toBe(false);
            expect(handle.clearTransientError).not.toHaveBeenCalled();
        });

        it('propagates handle rejection (no entry to clear) as false', () => {
            const handle = makeHandle();
            handle.clearTransientError.mockReturnValueOnce(false);
            registry.register('.foo', handle);

            const result = registry.clearTransientError('.foo', 'occurrence-no-entry');

            expect(result).toBe(false);
            expect(handle.clearTransientError).toHaveBeenCalledWith('occurrence-no-entry');
        });
    });

    describe('clearAllTransientErrors', () => {
        it('clears only the target path when one is given', () => {
            const a = makeHandle();
            const b = makeHandle();
            registry.register('.foo', a);
            registry.register('.bar', b);

            registry.clearAllTransientErrors('.foo');

            expect(a.clearAllTransientErrors).toHaveBeenCalledOnce();
            expect(b.clearAllTransientErrors).not.toHaveBeenCalled();
        });

        it('silently no-ops for an unknown path', () => {
            const a = makeHandle();
            registry.register('.foo', a);

            expect(() => registry.clearAllTransientErrors('.unknown')).not.toThrow();
            expect(a.clearAllTransientErrors).not.toHaveBeenCalled();
        });

        it('clears every registered handle when no path is given', () => {
            const a = makeHandle();
            const b = makeHandle();
            const c = makeHandle();
            registry.register('.foo', a);
            registry.register('.bar', b);
            registry.register('.baz', c);

            registry.clearAllTransientErrors();

            expect(a.clearAllTransientErrors).toHaveBeenCalledOnce();
            expect(b.clearAllTransientErrors).toHaveBeenCalledOnce();
            expect(c.clearAllTransientErrors).toHaveBeenCalledOnce();
        });
    });

    describe('getOccurrenceIds', () => {
        it('returns the handle snapshot for registered paths', () => {
            const handle = makeHandle();
            handle.getOccurrenceIds.mockReturnValue(['occurrence-0', 'occurrence-1']);
            registry.register('.foo', handle);

            expect(registry.getOccurrenceIds('.foo')).toEqual(['occurrence-0', 'occurrence-1']);
        });

        it('returns undefined for an unknown path', () => {
            registry.register('.foo', makeHandle());
            expect(registry.getOccurrenceIds('.bar')).toBeUndefined();
        });
    });

    describe('hasField', () => {
        it('reports true for registered paths and false otherwise', () => {
            registry.register('.foo', makeHandle());
            expect(registry.hasField('.foo')).toBe(true);
            expect(registry.hasField('.bar')).toBe(false);
        });
    });

    describe('acquireProcessing', () => {
        it('routes to the handle and returns the token it produces', () => {
            const handle = makeHandle();
            handle.acquireProcessing.mockReturnValueOnce('token-abc');
            registry.register('.foo', handle);

            const token = registry.acquireProcessing('.foo', 'occurrence-0');

            expect(token).toBe('token-abc');
            expect(handle.acquireProcessing).toHaveBeenCalledWith('occurrence-0');
        });

        it('returns null and does not invoke the handle when the path is unknown', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            const token = registry.acquireProcessing('.bar', 'occurrence-0');

            expect(token).toBeNull();
            expect(handle.acquireProcessing).not.toHaveBeenCalled();
        });

        it('propagates handle rejection (already processing / stale ID) as null', () => {
            const handle = makeHandle();
            handle.acquireProcessing.mockReturnValueOnce(null);
            registry.register('.foo', handle);

            const token = registry.acquireProcessing('.foo', 'occurrence-stale');

            expect(token).toBeNull();
        });
    });

    describe('releaseProcessing', () => {
        it('finds the holding handle and returns the handle result', () => {
            const handle = makeHandle();
            handle.releaseProcessing.mockReturnValueOnce(true);
            registry.register('.foo', handle);

            const result = registry.releaseProcessing('token-abc');

            expect(result).toBe(true);
            expect(handle.releaseProcessing).toHaveBeenCalledWith('token-abc');
        });

        it('returns false when no registered handle owns the token', () => {
            const handle = makeHandle();
            handle.releaseProcessing.mockReturnValue(false);
            registry.register('.foo', handle);

            const result = registry.releaseProcessing('token-unknown');

            expect(result).toBe(false);
        });

        it('returns false when no handles are registered', () => {
            const result = registry.releaseProcessing('token-orphan');
            expect(result).toBe(false);
        });
    });

    describe('isProcessing', () => {
        it('routes to the handle and returns the handle result', () => {
            const handle = makeHandle();
            handle.isProcessing.mockReturnValueOnce(true);
            registry.register('.foo', handle);

            expect(registry.isProcessing('.foo', 'occurrence-0')).toBe(true);
            expect(handle.isProcessing).toHaveBeenCalledWith('occurrence-0');
        });

        it('returns false for an unknown path', () => {
            registry.register('.foo', makeHandle());
            expect(registry.isProcessing('.bar', 'occurrence-0')).toBe(false);
        });
    });

    describe('reveal', () => {
        it('routes to the handle with no occurrenceId when omitted', () => {
            const handle = makeHandle();
            handle.reveal.mockReturnValueOnce(true);
            registry.register('.foo', handle);

            const result = registry.reveal('.foo');

            expect(result).toBe(true);
            expect(handle.reveal).toHaveBeenCalledWith(undefined, undefined);
        });

        it('forwards occurrenceId and options to the handle', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            registry.reveal('.foo', 'occurrence-1', {focus: true});

            expect(handle.reveal).toHaveBeenCalledWith('occurrence-1', {focus: true});
        });

        it('returns false for an unknown path', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            expect(registry.reveal('.bar')).toBe(false);
            expect(handle.reveal).not.toHaveBeenCalled();
        });
    });

    describe('focus', () => {
        it('routes to the handle with no occurrenceId when omitted', () => {
            const handle = makeHandle();
            handle.focus.mockReturnValueOnce(true);
            registry.register('.foo', handle);

            const result = registry.focus('.foo');

            expect(result).toBe(true);
            expect(handle.focus).toHaveBeenCalledWith(undefined);
        });

        it('returns false for an unknown path', () => {
            const handle = makeHandle();
            registry.register('.foo', handle);

            expect(registry.focus('.bar')).toBe(false);
            expect(handle.focus).not.toHaveBeenCalled();
        });
    });

    describe('subscribeActivePath', () => {
        function flushMicrotasks(): Promise<void> {
            return new Promise(resolve => queueMicrotask(resolve));
        }

        it('invokes subscribers with the latest active path after the microtask flushes', async () => {
            const subscriber = vi.fn();
            registry.subscribeActivePath(subscriber);

            const {notifyActivePath} = registry.register('.foo', makeHandle());
            notifyActivePath('.foo');

            // Synchronous: not yet delivered.
            expect(subscriber).not.toHaveBeenCalled();

            await flushMicrotasks();

            expect(subscriber).toHaveBeenCalledExactlyOnceWith('.foo');
        });

        it('coalesces blur-then-focus within the same microtask to a single emit', async () => {
            const subscriber = vi.fn();
            registry.subscribeActivePath(subscriber);

            const {notifyActivePath: notifyA} = registry.register('.foo', makeHandle());
            const {notifyActivePath: notifyB} = registry.register('.bar', makeHandle());

            notifyA(undefined);
            notifyB('.bar');

            await flushMicrotasks();

            // Without coalescing the subscriber would see [undefined, '.bar'].
            expect(subscriber).toHaveBeenCalledExactlyOnceWith('.bar');
        });

        it('isolates exceptions thrown by one subscriber so others still receive the value', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            const throwing = vi.fn(() => {
                throw new Error('boom');
            });
            const sane = vi.fn();
            registry.subscribeActivePath(throwing);
            registry.subscribeActivePath(sane);

            const {notifyActivePath} = registry.register('.foo', makeHandle());
            notifyActivePath('.foo');
            await flushMicrotasks();

            expect(throwing).toHaveBeenCalledOnce();
            expect(sane).toHaveBeenCalledExactlyOnceWith('.foo');
            expect(consoleError).toHaveBeenCalled();
            consoleError.mockRestore();
        });

        it('returns an unsubscribe function that stops further deliveries', async () => {
            const subscriber = vi.fn();
            const unsubscribe = registry.subscribeActivePath(subscriber);

            const {notifyActivePath} = registry.register('.foo', makeHandle());
            notifyActivePath('.foo');
            await flushMicrotasks();
            expect(subscriber).toHaveBeenCalledOnce();

            unsubscribe();
            notifyActivePath('.bar');
            await flushMicrotasks();
            expect(subscriber).toHaveBeenCalledOnce(); // still one — no second delivery
        });

        it('supports multiple subscribers receiving the same coalesced value', async () => {
            const a = vi.fn();
            const b = vi.fn();
            registry.subscribeActivePath(a);
            registry.subscribeActivePath(b);

            const {notifyActivePath} = registry.register('.foo', makeHandle());
            notifyActivePath('.foo');
            await flushMicrotasks();

            expect(a).toHaveBeenCalledExactlyOnceWith('.foo');
            expect(b).toHaveBeenCalledExactlyOnceWith('.foo');
        });
    });
});
