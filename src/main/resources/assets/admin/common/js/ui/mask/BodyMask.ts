import {Mask} from './Mask';

export class BodyMask
    extends Mask {

    private static instance: BodyMask;

    constructor() {
        super();
        this.addClass('body-mask');
    }

    static get(): BodyMask {
        if (!BodyMask.instance) {
            BodyMask.instance = new BodyMask();
        }
        return BodyMask.instance;
    }

}
