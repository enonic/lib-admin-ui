import {Mask} from './Mask';
import {Store} from '../../store/Store';

export const BODY_MASK_KEY: string = 'BodyMask';

export class BodyMask
    extends Mask {

    private constructor() {
        super();
        this.addClass('body-mask');
    }

    static get(): BodyMask {
        let instance: BodyMask = Store.parentInstance().get(BODY_MASK_KEY);

        if (instance == null) {
            instance = new BodyMask();
            Store.parentInstance().set(BODY_MASK_KEY, instance);
        }

        return instance;
    }
}
