import $ from 'jquery';

import {Store} from './store/Store';
import {StyleHelper} from './StyleHelper';

// Legacy DivEl input types — register in InputTypeManager via side-effect imports.
// The React input types are @enonic/input-types, re-exported from form2/ for the dev JAR's
// consumers; they register into the toolkit's registry and are not part of lib.js.
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
import './form/inputtype/time/DateTimeRange';
import './form/inputtype/time/LocalDateTime';
import './form/inputtype/time/Time';

const hasJQuery = Store.instance().has('$');
if (!hasJQuery) {
    Store.instance().set('$', $);
}

StyleHelper.setCurrentPrefix(StyleHelper.ADMIN_PREFIX);
