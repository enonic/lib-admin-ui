// Re-exported from @enonic/input-types: the schema model lives in the toolkit now (#4692).
import type {FieldSet, FormItemSet, FormOptionSet, FormOptionSetOption} from '@enonic/input-types/schema';

export {FormItem, type FormItemKind} from '@enonic/input-types/schema';

export type FormItemParent = FieldSet | FormItemSet | FormOptionSet | FormOptionSetOption;
