// Re-exported from @enonic/input-types: the schema model lives in the toolkit now (#4692).
import type {InputConfigEntries} from '@enonic/input-types';

export {Input, InputBuilder} from '@enonic/input-types/schema';

/** The input type config as a descriptor reads it — this library's REST shape; the toolkit calls it `InputConfigEntries`. */
export type RawInputConfig = InputConfigEntries;
