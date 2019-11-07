import {InputEl} from '../../dom/InputEl';

export class PasswordInput
    extends InputEl {

    constructor(className?: string) {
        super(className, 'password');

        this.setPattern('\\S+');

        this.addClass('password-input');
    }

}
