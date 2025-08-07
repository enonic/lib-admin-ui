import $ from 'jquery';
import 'jquery-simulate/jquery.simulate.js';
import {StyleHelper} from '../StyleHelper';
import {Body} from './Body';
import {FormItemEl} from './FormItemEl';

export class ButtonEl
    extends FormItemEl {

    constructor(className?: string, stylePrefix: string = StyleHelper.COMMON_PREFIX) {
        super('button', className, stylePrefix);

        this.getEl().setAttribute('type', 'button');

        const triggerAction = () => {
            Body.get().setFocusedElement(this);
            $(this.getHTMLElement()).simulate('click');
        };
        this.onApplyKeyPressed(triggerAction);
    }

    setEnabled(value: boolean) {
        super.setEnabled(value);
        this.getEl().setDisabled(!value);
        this.setAriaDisabled(!value);
        return this;
    }

}
