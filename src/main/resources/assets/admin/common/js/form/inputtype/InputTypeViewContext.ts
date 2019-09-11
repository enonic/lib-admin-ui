import {FormContext} from '../FormContext';
import {Input} from '../Input';
import {PropertyPath} from '../../data/PropertyPath';

export interface InputTypeViewContext {

    formContext: FormContext;

    input: Input;

    inputConfig: { [element: string]: { [name: string]: string }[]; };

    parentDataPath: PropertyPath;
}
