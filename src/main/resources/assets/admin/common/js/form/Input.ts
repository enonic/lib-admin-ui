// Deprecated re-exports of the toolkit, removed in 7.0 (#4713): import from the package named below instead.
import type {InputConfigEntries} from '@enonic/input-types';

export {
    /** @deprecated Import from '@enonic/input-types/schema'. */
    Input,
    /** @deprecated Import from '@enonic/input-types/schema'. */
    InputBuilder,
} from '@enonic/input-types/schema';

/** The input type config as a descriptor reads it — this library's REST shape; the toolkit calls it `InputConfigEntries`. */
export type RawInputConfig = InputConfigEntries;
