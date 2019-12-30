import {Message, Type} from './Message';

export class NotifyOpts {
    message: string;
    type: string;
    listeners: { (): void }[];
    autoHide: boolean;

    static buildOpts(message: Message): NotifyOpts {
        const opts = new NotifyOpts();
        opts.autoHide = message.getAutoHide();
        if (message.getType() === Type.ERROR) {
            opts.type = 'error';
        } else if (message.getType() === Type.WARNING) {
            opts.type = 'warning';
        } else if (message.getType() === Type.ACTION) {
            opts.type = 'action';
        } else if (message.getType() === Type.SUCCESS) {
            opts.type = 'success';
        }

        opts.setMessage(message).addListeners(message);

        return opts;
    }

    addListeners(message: Message): NotifyOpts {
        this.listeners = [];
        let actions = message.getActions();

        for (let i = 0; i < actions.length; i++) {
            this.listeners.push(actions[i].getHandler());
        }
        return this;
    }

    setMessage(msg: Message): NotifyOpts {
        this.message = msg.getText();
        return this;
    }
}
