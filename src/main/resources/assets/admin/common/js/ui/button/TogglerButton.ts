import {Button} from './Button';

export class TogglerButton
    extends Button {

    private activeListeners: ((isActive: boolean) => void)[] = [];

    constructor(className?: string, title?: string) {
        super();
        this.addClass('toggle-button icon-medium');
        if (className) {
            this.addClass(className);
        }
        this.setActive(false);
        this.setEnabled(false);

        if (title) {
            this.setTitle(title);
        }

        this.onClicked((event: MouseEvent) => {

            if (this.isEnabled()) {
                this.setActive(!this.isActive());
            }
        });
    }

    setActive(value: boolean, silent: boolean = false) {
        this.toggleClass('active', value);
        if (!silent) {
            this.notifyActiveChanged(value);
        }
    }

    setVisible(value: boolean): TogglerButton {
        if (!value) {
            this.setActive(value);
        }
        return super.setVisible(value) as TogglerButton;
    }

    isActive() {
        return this.hasClass('active');
    }

    onActiveChanged(listener: (isActive: boolean) => void) {
        this.activeListeners.push(listener);
    }

    unActiveChanged(listener: (isActive: boolean) => void) {
        this.activeListeners = this.activeListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyActiveChanged(isActive: boolean) {
        this.activeListeners.forEach((listener) => {
            listener(isActive);
        });
    }
}
