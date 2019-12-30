export class KeyHelper {

    static isNumber(event: KeyboardEvent): boolean {
        return /^[0-9]$/i.test(event.key);
    }

    static isLetter(event: KeyboardEvent): boolean {
        return /^[a-z]$/i.test(event.key);
    }

    static isAlphaNumeric(event: KeyboardEvent): boolean {
        return /^[a-z0-9]$/i.test(event.key);
    }

    static isDash(event: KeyboardEvent): boolean {
        return event.key === '-';
    }

    static isDel(event: KeyboardEvent): boolean {
        return event.key === 'Delete' || event.key === 'Del';
    }

    static isSpace(event: KeyboardEvent): boolean {
        return event.key === ' ' || event.key === 'Spacebar';
    }

    static isBackspace(event: KeyboardEvent): boolean {
        return event.key === 'Backspace';
    }

    static isSemiColon(event: KeyboardEvent): boolean {
        return event.key === ';';
    }

    static isComma(event: KeyboardEvent): boolean {
        return event.key === ',';
    }

    static isDot(event: KeyboardEvent): boolean {
        return event.key === '.';
    }

    static isArrowKey(event: KeyboardEvent): boolean {
        return KeyHelper.isArrowLeftKey(event) || KeyHelper.isArrowUpKey(event) || KeyHelper.isArrowRightKey(event) ||
               KeyHelper.isArrowDownKey(event);
    }

    static isArrowLeftKey(event: KeyboardEvent): boolean {
        return event.key === 'ArrowLeft' || event.key === 'Left';
    }

    static isArrowUpKey(event: KeyboardEvent): boolean {
        return event.key === 'ArrowUp' || event.key === 'Up';
    }

    static isArrowRightKey(event: KeyboardEvent): boolean {
        return event.key === 'ArrowRight' || event.key === 'Right';
    }

    static isArrowDownKey(event: KeyboardEvent): boolean {
        return event.key === 'ArrowDown' || event.key === 'Down';
    }

    static isControlKey(event: KeyboardEvent): boolean {
        return event.key === 'Control';
    }

    static isControlKeyPressed(event: KeyboardEvent): boolean {
        return event.ctrlKey;
    }

    static isShiftKey(event: KeyboardEvent): boolean {
        return event.key === 'Shift';
    }

    static isShiftKeyPressed(event: KeyboardEvent): boolean {
        return event.shiftKey;
    }

    static isAltKey(event: KeyboardEvent): boolean {
        return event.key === 'Alt';
    }

    static isAltKeyPressed(event: KeyboardEvent): boolean {
        return event.altKey;
    }

    static isMetaKey(event: KeyboardEvent): boolean {
        return event.metaKey;
    }

    static isTabKey(event: KeyboardEvent): boolean {
        return event.key === 'Tab';
    }

    static isModifierKey(event: KeyboardEvent): boolean {
        return KeyHelper.isControlKeyPressed(event) || KeyHelper.isShiftKeyPressed(event) || KeyHelper.isAltKeyPressed(event) ||
               KeyHelper.isMetaKey(event);
    }

    static isEscKey(event: KeyboardEvent): boolean {
        return event.key === 'Escape' || event.key === 'Esc';
    }

    static isEnterKey(event: KeyboardEvent): boolean {
        return event.key === 'Enter';
    }

    static isApplyKey(event: KeyboardEvent): boolean {
        return KeyHelper.isEnterKey(event) || KeyHelper.isSpace(event);
    }
}
