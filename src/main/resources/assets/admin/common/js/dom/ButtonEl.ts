import {StyleHelper} from '../StyleHelper';
import {FormItemEl} from './FormItemEl';

export class ButtonEl
    extends FormItemEl {

    constructor(className?: string) {
        super('button', className, StyleHelper.COMMON_PREFIX);
    }

}
