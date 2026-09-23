// Re-exported from @enonic/input-types: the schema model lives in the toolkit now (#4692).
import type {InputConfigJson} from '@enonic/ui-types';

export {Input, InputBuilder} from '@enonic/input-types/schema';

/** The raw input type config as the schema carries it; the toolkit calls it `InputConfigJson`. */
export type RawInputConfig = InputConfigJson;
