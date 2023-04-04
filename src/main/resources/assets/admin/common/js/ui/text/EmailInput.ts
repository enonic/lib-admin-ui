import * as Q from 'q';
import {InputEl} from '../../dom/InputEl';
import {StringHelper} from '../../util/StringHelper';
import {CheckEmailAvailabilityRequest} from '../../security/CheckEmailAvailabilityRequest';
import {i18n} from '../../util/Messages';
import {CompositeFormInputEl} from '../../dom/CompositeFormInputEl';

export class EmailInput
    extends CompositeFormInputEl {

    private input: InputEl;

    private originEmail: string;

    private status: string;

    private checkTimeout: number;

    private request: CheckEmailAvailabilityRequest;

    private focusListeners: { (event: FocusEvent): void }[];

    private blurListeners: { (event: FocusEvent): void }[];

    constructor() {
        super();
        this.focusListeners = [];
        this.blurListeners = [];

        this.input = this.createInput();
        this.input.setAutocomplete(true);

        this.setWrappedInput(this.input);

        this.addClass('email-input just-shown');
        this.updateStatus('available');
    }

    createInput(): InputEl {
        let input = new InputEl(undefined, 'email');
        // eslint-disable-next-line max-len
        input.setPattern('^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');

        input.onFocus((event: FocusEvent) => {
            this.notifyFocused(event);
        });

        input.onBlur((event: FocusEvent) => {
            this.notifyBlurred(event);
        });
        input.onInput(() => {
            if (this.checkTimeout) {
                clearTimeout(this.checkTimeout);
            }

            this.checkTimeout = window.setTimeout((email) => this.checkAvailability(email), 500, this.input.getValue());

        });

        return input;
    }

    setRequest(request: CheckEmailAvailabilityRequest) {
        this.request = request;
    }

    getInput(): InputEl {
        return this.input;
    }

    doSetValue(value: string, silent?: boolean): EmailInput {
        super.doSetValue(value, silent);
        this.checkAvailability(value);
        return this;
    }

    getOriginEmail(): string {
        return this.originEmail;
    }

    setOriginEmail(value: string): EmailInput {
        this.originEmail = value;
        return this;
    }

    isAvailable(): boolean {
        return this.hasClass('available');
    }

    isValid(): boolean {
        return this.input.isValid() && !StringHelper.isEmpty(this.doGetValue()) && this.isAvailable();
    }

    validate(): boolean {
        return this.input.validate();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners.push(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners = this.focusListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners.push(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners = this.blurListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private checkAvailability(email: string) {
        let status;
        let isValid = this.input.isValid();
        this.toggleClass('invalid', !isValid);
        if (!isValid) {
            this.getEl().setAttribute('data-status', i18n('field.email.invalid'));
        }

        if (!StringHelper.isEmpty(email) && isValid) {
            status = 'checking';
            let promise;
            if (email === this.originEmail || !this.request) {
                promise = Q(true);
            } else {
                this.request.setEmail(email);
                promise = this.request.sendAndParse();
            }
            promise.then((available: boolean) => {
                this.updateStatus(available ? 'available' : 'notavailable');
                this.notifyValidityChanged(isValid && available);
                this.removeClass('just-shown');
            }).fail(() => {
                this.notifyValidityChanged(false);
                this.updateStatus('error');
            }).done();
        } else {
            this.notifyValidityChanged(isValid);
        }

        this.updateStatus(status);
    }

    private updateStatus(status?: string) {
        if (!!this.status) {
            this.removeClass(this.status);
        }
        if (!StringHelper.isEmpty(status)) {
            this.status = status;
            this.addClass(this.status);
            this.getEl().setAttribute('data-status', i18n(`field.emailInput.${status}`));
        }
    }

    private notifyFocused(event: FocusEvent) {
        this.focusListeners.forEach((listener) => {
            listener(event);
        });
    }

    private notifyBlurred(event: FocusEvent) {
        this.blurListeners.forEach((listener) => {
            listener(event);
        });
    }
}
