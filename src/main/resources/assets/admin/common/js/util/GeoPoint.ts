import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from './StringHelper';

export class GeoPoint
    implements Equitable {

    private latitude: number;

    private longitude: number;

    constructor(latitude: number, longitude: number) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    static isValidString(s: string): boolean {
        if (StringHelper.isBlank(s)) {
            return false;
        }

        let indexOfComma = s.indexOf(',');
        if (indexOfComma < 1 || s.split(',').length !== 2) {
            return false;
        } else if (indexOfComma === s.length - 1) {
            return false;
        }

        let coordinates: string[] = s.split(',');

        let latitude = Number(coordinates[0]);
        let longitude = Number(coordinates[1]);

        let isNumber = typeof latitude === 'number' && !isNaN(latitude) &&
                       typeof longitude === 'number' && !isNaN(longitude);

        if (!isNumber) {
            return false;
        }

        return (-90 <= latitude && latitude <= 90) && (-180 <= longitude && longitude <= 180);
    }

    static fromString(s: string): GeoPoint {
        if (!GeoPoint.isValidString(s)) {
            throw new Error('Cannot parse GeoPoint from string: ' + s);
        }
        let coordinates: string[] = s.split(',');
        let latitude = Number(coordinates[0]);
        let longitude = Number(coordinates[1]);
        return new GeoPoint(latitude, longitude);
    }

    getLatitude(): number {
        return this.latitude;
    }

    getLongitude(): number {
        return this.longitude;
    }

    toString(): string {
        return '' + this.latitude + ',' + this.longitude;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, GeoPoint)) {
            return false;
        }

        let other = o as GeoPoint;

        if (!ObjectHelper.numberEquals(this.latitude, other.latitude)) {
            return false;
        }

        if (!ObjectHelper.numberEquals(this.longitude, other.longitude)) {
            return false;
        }
        return true;
    }
}
