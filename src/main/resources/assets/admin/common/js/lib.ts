// import * as $ from 'jquery'; // jquery is a peerDependency

// import '../lib/slickgrid/index.js';

import {Store} from './store/Store';
import {StyleHelper} from './StyleHelper';

import './form/inputtype/support/NoInputTypeFoundView';
import './form/inputtype/checkbox/Checkbox';
import './form/inputtype/combobox/ComboBox';
import './form/inputtype/time/Date';
import './form/inputtype/time/DateTime';
import './form/inputtype/time/DateTimeRange';
import './form/inputtype/time/Time';
import './form/inputtype/number/Double';
import './form/inputtype/number/Long';
import './form/inputtype/geo/GeoPoint';
import './form/inputtype/principal/PrincipalSelector';
import './form/inputtype/radiobutton/RadioButton';
import './form/inputtype/text/TextArea';
import './form/inputtype/text/TextLine';

const hasJQuery = Store.instance().has('$');
if (!hasJQuery) {
    Store.instance().set('$', $);
}

StyleHelper.setCurrentPrefix(StyleHelper.ADMIN_PREFIX);

