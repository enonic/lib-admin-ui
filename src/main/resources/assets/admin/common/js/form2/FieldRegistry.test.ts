import {beforeEach, describe, expect, it, vi} from 'vitest';
import {FieldRegistry} from './FieldRegistry';

type HandleMocks = {
    setTransientError: ReturnType<typeof vi.fn<(occurrenceId: string, message: string) => boolean>>;
    clearTransientError: ReturnType<typeof vi.fn<(occurrenceId: string) => boolean>>;
    clearAllTransientErrors: ReturnType<typeof vi.fn<() => void>>;
    getOccurrenceIds: ReturnType<typeof vi.fn<() => string[]>>;
};

function makeHandle(): HandleMocks {
    return {
        // Default to success — individual tests override with mockReturnValueOnce when
        // they need to simulate manager-rejection (stale ID, removed occurrence).
        setTransientError: vi.fn<(occurrenceId: string, message: string) => boolean>(() => true),
        clearTransientError: vi.fn<(occurrenceId: string) => boolean>(() => true),
        clearAllTransientErrors: vi.fn<() => void>(),
        getOccurrenceIds: vi.fn<() => string[]>(() => []),
    };
}

describe('FieldRegistry', () => {
    let registry: FieldRegistry;

    beforeEach(() => {
        registry = new FieldRegistry();
    });

    describe('register', () => {
        it('returns an unregister function that drops the handle', () => {
            const handle = makeHandle();
            const unregister = registry.register('.foo', handle);

            expect(registry.hasField('.foo')).toBe(true);
            unregister();
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
            const unregisterFirst = registry.register('.foo', first);
            registry.register('.foo', second);

            unregisterFirst();

            // ? Second handle must remain — stale unregister identifies its target
            // ? by handle identity, not by path alone.
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
});
