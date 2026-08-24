import {describe, expect, it, vi} from 'vitest';
import {getNextMobileFocusTarget, handleMobileCompletionKeyDown} from './accessibility';

const FIELD_SELECTOR = '[data-component="InputField"]';
const EXPLICIT_SELECTOR = '[data-mobile-focus-target="true"]';

function makeElement(overrides: Record<string, unknown> = {}): HTMLElement {
    return {
        tabIndex: 0,
        hidden: false,
        parentElement: null,
        matches: () => false,
        getAttribute: () => null,
        hasAttribute: () => false,
        querySelectorAll: () => [],
        closest: () => null,
        compareDocumentPosition: () => 4,
        ...overrides,
    } as unknown as HTMLElement;
}

function setOwnerDocument(element: HTMLElement, ownerDocument: unknown): void {
    Object.defineProperty(element, 'ownerDocument', {value: ownerDocument});
}

describe('mobile accessibility helpers', () => {
    it('prefers the next field explicit input even when sortable navigation sets tabIndex=-1', () => {
        const nestedInput = makeElement({tabIndex: -1});
        const row = makeElement();
        const nextField = makeElement({
            querySelectorAll: (selector: string) =>
                selector === EXPLICIT_SELECTOR ? [nestedInput] : [row, nestedInput],
        });
        const currentField = makeElement();
        const ownerDocument = {
            querySelectorAll: (selector: string) => (selector === FIELD_SELECTOR ? [currentField, nextField] : []),
        };
        const currentInput = makeElement({ownerDocument, closest: () => currentField});
        setOwnerDocument(nestedInput, ownerDocument);

        expect(getNextMobileFocusTarget(currentInput)).toBe(nestedInput);
    });

    it('skips explicit inputs inside hidden field content', () => {
        const hiddenParent = makeElement({hidden: true});
        const hiddenInput = makeElement({parentElement: hiddenParent});
        const visibleInput = makeElement();
        const hiddenField = makeElement({
            querySelectorAll: (selector: string) => (selector === EXPLICIT_SELECTOR ? [hiddenInput] : []),
        });
        const visibleField = makeElement({
            querySelectorAll: (selector: string) => (selector === EXPLICIT_SELECTOR ? [visibleInput] : []),
        });
        const currentField = makeElement();
        const ownerDocument = {
            querySelectorAll: (selector: string) =>
                selector === FIELD_SELECTOR ? [currentField, hiddenField, visibleField] : [],
        };
        const currentInput = makeElement({ownerDocument, closest: () => currentField});
        setOwnerDocument(hiddenParent, ownerDocument);
        setOwnerDocument(hiddenInput, ownerDocument);
        setOwnerDocument(visibleInput, ownerDocument);

        expect(getNextMobileFocusTarget(currentInput)).toBe(visibleInput);
    });

    it('completes only Enter and suppresses its default behavior', () => {
        const onMobileComplete = vi.fn();
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        const currentTarget = makeElement();

        handleMobileCompletionKeyDown({key: 'Enter', currentTarget, preventDefault, stopPropagation}, onMobileComplete);

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(onMobileComplete).toHaveBeenCalledWith(currentTarget);
    });

    it('does not complete Enter while an IME composition is active', () => {
        const onMobileComplete = vi.fn();
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        handleMobileCompletionKeyDown(
            {key: 'Enter', isComposing: true, currentTarget: makeElement(), preventDefault, stopPropagation},
            onMobileComplete,
        );

        expect(preventDefault).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
        expect(onMobileComplete).not.toHaveBeenCalled();
    });
});
