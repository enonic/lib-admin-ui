import $ from 'jquery';

import {Store} from './store/Store';
import {StyleHelper} from './StyleHelper';

// Legacy DivEl input types — register in InputTypeManager via side-effect imports.
// New React input types (inputtype2/) are NOT imported here. They use Store-backed
// registries (ComponentRegistry, DescriptorRegistry) and are consumed via the dev JAR.
import './form/inputtype/checkbox/Checkbox';
import './form/inputtype/combobox/ComboBox';
import './form/inputtype/geo/GeoPoint';
import './form/inputtype/number/Double';
import './form/inputtype/number/Long';
import './form/inputtype/principal/PrincipalSelector';
import './form/inputtype/radiobutton/RadioButton';
import './form/inputtype/support/NoInputTypeFoundView';
import './form/inputtype/text/TextArea';
import './form/inputtype/text/TextLine';
import './form/inputtype/time/Date';
import './form/inputtype/time/DateTime';
import './form/inputtype/time/DateTimeRange';
import './form/inputtype/time/Instant';
import './form/inputtype/time/Time';

const hasJQuery = Store.instance().has('$');
if (!hasJQuery) {
    Store.instance().set('$', $);
}

StyleHelper.setCurrentPrefix(StyleHelper.ADMIN_PREFIX);
