import type {Input} from '../../form/Input';

const INPUT_FIELD_SELECTOR = '[data-component="InputField"]';
const MOBILE_FOCUS_TARGET_SELECTOR = '[data-mobile-focus-target="true"]';
const FALLBACK_FOCUS_TARGET_SELECTOR =
    'input:not([type="hidden"]), textarea, select, [role="combobox"], [role="radio"], button, a[href], [contenteditable="true"], [tabindex]';

function isUnavailableMobileFocusTarget(element: HTMLElement): boolean {
    if (
        element.matches?.(':disabled') ||
        ('disabled' in element && element.disabled === true) ||
        element.getAttribute?.('aria-disabled') === 'true'
    ) {
        return true;
    }

    if ('readOnly' in element && element.readOnly === true) {
        return true;
    }

    for (let current: HTMLElement | null = element; current != null; current = current.parentElement) {
        if (current.hidden || current.hasAttribute?.('inert') || current.getAttribute?.('aria-hidden') === 'true') {
            return true;
        }

        const style = current.ownerDocument?.defaultView?.getComputedStyle(current);
        if (style?.display === 'none' || style?.visibility === 'hidden') {
            return true;
        }
    }

    return false;
}

function getMobileFocusTarget(container: HTMLElement): HTMLElement | undefined {
    const explicitTarget = Array.from(container.querySelectorAll<HTMLElement>(MOBILE_FOCUS_TARGET_SELECTOR)).find(
        element => !isUnavailableMobileFocusTarget(element),
    );

    if (explicitTarget != null) {
        return explicitTarget;
    }

    return Array.from(container.querySelectorAll<HTMLElement>(FALLBACK_FOCUS_TARGET_SELECTOR)).find(
        element => element.tabIndex >= 0 && !isUnavailableMobileFocusTarget(element),
    );
}

function follows(reference: HTMLElement, candidate: HTMLElement): boolean {
    if (typeof reference.compareDocumentPosition !== 'function') {
        return true;
    }

    const following = reference.ownerDocument.defaultView?.Node.DOCUMENT_POSITION_FOLLOWING ?? 4;
    return Boolean(reference.compareDocumentPosition(candidate) & following);
}

export function handleMobileCompletionKeyDown<T extends HTMLElement>(
    event: {
        key: string;
        isComposing?: boolean;
        currentTarget: T;
        preventDefault: () => void;
        stopPropagation: () => void;
    },
    onMobileComplete?: (element: HTMLElement) => void,
): void {
    if (event.key !== 'Enter' || event.isComposing === true || onMobileComplete == null) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    onMobileComplete(event.currentTarget);
}

export function getInputAccessibleName(input: Input, index?: number): string {
    const label = input.getLabel() || input.getName().toString();

    if (index == null || !input.getOccurrences().multiple()) {
        return label;
    }

    return `${label} ${index + 1}`;
}

export function getNextMobileFocusTarget(element: HTMLElement): HTMLElement | undefined {
    const currentField = element.closest<HTMLElement>(INPUT_FIELD_SELECTOR);

    if (currentField != null) {
        const fields = Array.from(element.ownerDocument.querySelectorAll<HTMLElement>(INPUT_FIELD_SELECTOR));
        const currentFieldIndex = fields.indexOf(currentField);

        if (currentFieldIndex >= 0) {
            for (let index = currentFieldIndex + 1; index < fields.length; index += 1) {
                const target = getMobileFocusTarget(fields[index]);
                if (target != null) {
                    return target;
                }
            }
        }
    }

    const fallbackTargets = Array.from(
        element.ownerDocument.querySelectorAll<HTMLElement>(FALLBACK_FOCUS_TARGET_SELECTOR),
    );
    const currentTargetIndex = fallbackTargets.indexOf(element);
    const candidates = currentTargetIndex < 0 ? fallbackTargets : fallbackTargets.slice(currentTargetIndex + 1);

    return candidates.find(
        candidate =>
            candidate !== element &&
            !currentField?.contains(candidate) &&
            follows(currentField ?? element, candidate) &&
            candidate.tabIndex >= 0 &&
            !isUnavailableMobileFocusTarget(candidate),
    );
}
