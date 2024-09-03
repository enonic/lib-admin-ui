import {StyleHelper} from '../StyleHelper';
import {FormItemEl} from './FormItemEl';
import * as $ from 'jquery';
import {Body} from './Body';

export class ButtonEl
    extends FormItemEl {

    constructor(className?: string, stylePrefix: string = StyleHelper.COMMON_PREFIX) {
        super('button', className, stylePrefix);

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
