import {beforeEach, describe, expect, it, vi} from 'vitest';

import {useIsMobile} from './useIsMobile';

const mocks = vi.hoisted(() => ({
    getIsMobile: vi.fn(() => false),
    subscribeToMobileChanges: vi.fn(),
    state: false,
    initialized: false,
    effectInitialized: false,
}));

vi.mock('@enonic/ui', () => ({
    getIsMobile: mocks.getIsMobile,
    subscribeToMobileChanges: mocks.subscribeToMobileChanges,
}));

vi.mock('react', () => ({
    useEffect: (effect: () => void) => {
        if (!mocks.effectInitialized) {
            mocks.effectInitialized = true;
            effect();
        }
    },
    useState: (initial: () => boolean) => {
        if (!mocks.initialized) {
            mocks.initialized = true;
            mocks.state = initial();
        }
        return [
            mocks.state,
            (value: boolean) => {
                mocks.state = value;
            },
        ];
    },
}));

describe('useIsMobile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.state = false;
        mocks.initialized = false;
        mocks.effectInitialized = false;
        mocks.getIsMobile.mockReturnValue(false);
        mocks.subscribeToMobileChanges.mockImplementation((listener: (isMobile: boolean) => void) => {
            listener(true);
            return vi.fn();
        });
    });

    it('uses mobile change notifications as the source of truth', () => {
        expect(useIsMobile()).toBe(false);
        expect(useIsMobile()).toBe(true);
    });
});
