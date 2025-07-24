export enum MessageType {
    INFO,
    ERROR,
    WARNING,
    ACTION,
    SUCCESS
}

export class MessageAction {
    private readonly name: string;
    private readonly handler: (e: MouseEvent) => void;

    constructor(name: string, handler: (e: MouseEvent) => void) {
        this.name = name;
        this.handler = handler;
    }

    getName(): string {
        return this.name;
    }

    getHandler(): (e: MouseEvent) => void {
        return this.handler;
    }
}

export class Message {
    private readonly type: MessageType;
    private readonly text: string;
    private readonly actions: MessageAction[];
    private readonly autoHide: boolean;

    constructor(type: MessageType, text: string, autoHide: boolean = true) {
        this.type = type;
        this.text = text;
        this.actions = [];
        this.autoHide = autoHide;
    }

    static newSuccess(text: string, autoHide: boolean = true): Message {
        return new Message(MessageType.SUCCESS, text, autoHide);
    }

    static newInfo(text: string, autoHide: boolean = true): Message {
        return new Message(MessageType.INFO, text, autoHide);
    }

    static newError(text: string, autoHide: boolean = true): Message {
        return new Message(MessageType.ERROR, text, autoHide);
    }

    static newWarning(text: string, autoHide: boolean = true): Message {
        return new Message(MessageType.WARNING, text, autoHide);
    }

    static newAction(text: string, autoHide: boolean = true): Message {
        return new Message(MessageType.ACTION, text, autoHide);
    }

    getType(): MessageType {
        return this.type;
    }

    isError(): boolean {
        return this.type === MessageType.ERROR;
    }

    isWarning(): boolean {
        return this.type === MessageType.WARNING;
    }

    getText(): string {
        return this.text;
    }

    getActions(): MessageAction[] {
        return this.actions;
    }

    getAutoHide(): boolean {
        return this.autoHide;
    }

    addAction(name: string, handler: (e: MouseEvent) => void): void {
        this.actions.push(new MessageAction(name, handler));
    }
}
