import type {Value} from '../../../data/Value';

const TAG_LABEL_MAX_LENGTH = 20;

export function normalizeTagDraft(raw: string): string {
    return raw.trim().replace(/,+$/, '').trim();
}

export function getTagLabel(value: Value): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

export function hasRenderableTagLabel(label: string): boolean {
    return normalizeTagDraft(label).length > 0;
}

export function isRenderableTagValue(value: Value): boolean {
    return hasRenderableTagLabel(getTagLabel(value));
}

export function hasTagLabel(values: Value[], label: string, excludedIndex?: number): boolean {
    if (!hasRenderableTagLabel(label)) {
        return false;
    }

    return values.some((value, index) => index !== excludedIndex && normalizeTagDraft(getTagLabel(value)) === label);
}

export function isTagLabelCropped(label: string): boolean {
    return label.length > TAG_LABEL_MAX_LENGTH;
}

export function getVisibleTagLabel(label: string): string {
    return isTagLabelCropped(label) ? `${label.slice(0, TAG_LABEL_MAX_LENGTH)}...` : label;
}
