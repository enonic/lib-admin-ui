import {Occurrences} from '../../form/Occurrences';
import type {InputTypeMode} from '../types';

/**
 * Normalizes server occurrences for single-value input types.
 *
 * For modes like Checkbox and RadioButton, the server may send 0:0 (unlimited)
 * as a default, but these types should always render exactly one value.
 * This function clamps their occurrences to min(min,1):1.
 *
 * All other types pass through unchanged.
 */
export function getEffectiveOccurrences(mode: InputTypeMode, occurrences: Occurrences): Occurrences {
    if (mode === 'single') {
        return Occurrences.minmax(Math.min(occurrences.getMinimum(), 1), 1);
    }
    return occurrences;
}
