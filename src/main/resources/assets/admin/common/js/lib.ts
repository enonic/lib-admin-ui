import $ from 'jquery';

import {Store} from './store/Store';
import {StyleHelper} from './StyleHelper';

import './form/inputtype/checkbox/Checkbox';
import './form/inputtype/combobox/ComboBox';
import './form/inputtype/geo/GeoPoint';
import './form/inputtype/number/Double';
import './form/inputtype/number/Long';
import './form/inputtype/principal/PrincipalSelector';
import './form/inputtype/radiobutton/RadioButton';
import './form/inputtype/support/NoInputTypeFoundView';
import './form/inputtype/text/TextArea';
import './form/inputtype2/TextLine';
import './form/inputtype2/ComponentRegistry';
import './form/inputtype/time/Date';
import './form/inputtype/time/DateTime';
import './form/inputtype/time/DateTimeRange';
import './form/inputtype/time/Time';
import './form/inputtype/time/Instant';

const hasJQuery = Store.instance().has('$');
if (!hasJQuery) {
    Store.instance().set('$', $);
}

StyleHelper.setCurrentPrefix(StyleHelper.ADMIN_PREFIX);

