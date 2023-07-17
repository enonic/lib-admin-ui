import {TextInput} from '../text/TextInput';
import {StringHelper} from '../../util/StringHelper';
import {GeoPoint as GeoPointUtil} from '../../util/GeoPoint';

export class GeoPoint
    extends TextInput {

    private validUserInput: boolean;

    constructor(originalValue?: GeoPointUtil) {
        super('geo-point', undefined, originalValue ? originalValue.toString() : undefined);

        this.validUserInput = true;
        this.getEl().setAttribute('title', 'latitude,longitude');
        this.setPlaceholder('latitude,longitude');

        this.onValueChanged(() => {
            let typedGeoPoint = this.getValue();
            this.validUserInput = StringHelper.isEmpty(typedGeoPoint) ||
                                  GeoPointUtil.isValidString(typedGeoPoint);

            this.updateValidationStatusOnUserInput(this.validUserInput);
        });
    }

    setGeoPoint(value: GeoPointUtil): GeoPoint {
        this.setValue(value ? value.toString() : '');
        return this;
    }

    getGeoPoint(): GeoPoint {
        let value = this.getValue();
        if (StringHelper.isEmpty(value)) {
            return null;
        }
        return GeoPoint.fromString(value) as GeoPoint;
    }

    isValid(): boolean {
        return this.validUserInput;
    }

}
