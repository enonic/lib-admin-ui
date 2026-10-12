// Deprecated re-exports of the toolkit, removed in 7.0 (#4713): import from the package named below instead.
import type {FieldSet, FormItemSet, FormOptionSet, FormOptionSetOption} from '@enonic/input-types/schema';

export {
    /** @deprecated Import from '@enonic/input-types/schema'. */
    FormItem,
    /** @deprecated Import from '@enonic/input-types/schema'. */
    type FormItemKind,
} from '@enonic/input-types/schema';

export type FormItemParent = FieldSet | FormItemSet | FormOptionSet | FormOptionSetOption;
