import {Class} from '../../Class';
import {InputTypeViewContext} from './InputTypeViewContext';
import {InputTypeView} from './InputTypeView';
import {Store} from '../../store/Store';

const INPUT_TYPES_KEY: string = 'inputTypes';

/**
 *      Class to manage input types and their visual representation
 */
export class InputTypeManager {

    private static getInputTypes(): Map<string, Class> {
        let inputTypes: Map<string, Class> = Store.instance().get(INPUT_TYPES_KEY);

        if (inputTypes == null) {
            inputTypes = new Map();
            Store.instance().set(INPUT_TYPES_KEY, inputTypes);
        }

        return inputTypes;
    }

    static isRegistered(inputTypeName: string): boolean {
        const name = InputTypeManager.normalize(inputTypeName);

        return InputTypeManager.getInputTypes().has(name);
    }

    static register(inputTypeClass: Class, silent?: boolean) {
        const name = InputTypeManager.normalize(inputTypeClass.getName());

        if (!InputTypeManager.isRegistered(name)) {
            InputTypeManager.getInputTypes().set(name, inputTypeClass);
        } else if (!silent) {
            throw new Error('Input type [' + name + '] is already registered, unregister it first.');
        }
    }

    static unregister(inputTypeName: string) {
        let name = InputTypeManager.normalize(inputTypeName);

        if (InputTypeManager.isRegistered(name)) {
            InputTypeManager.getInputTypes().delete(name);
            console.log('Unregistered input type [' + name + ']');
        } else {
            throw new Error('Input type [' + name + '] is not registered.');
        }
    }

    static createView(inputTypeName: string, context: InputTypeViewContext): InputTypeView {
        let name = InputTypeManager.normalize(inputTypeName);

        if (InputTypeManager.isRegistered(name)) {
            const inputTypeClass = InputTypeManager.getInputTypes().get(name);
            return inputTypeClass.newInstance(context);
        } else {
            throw new Error('Input type [' + name + '] need to be registered first.');
        }
    }

    private static normalize(inputTypeName: string): string {
        return (inputTypeName || '').toLowerCase();
    }
}
