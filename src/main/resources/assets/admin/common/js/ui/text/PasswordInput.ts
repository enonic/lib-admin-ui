module api.ui.text {

    export class PasswordInput extends api.dom.InputEl {

        constructor(className?: string) {
            super(className, 'password');

            this.setPattern('\\S+');

            this.addClass('password-input');
        }

    }
}
