import {FormContext} from '../FormContext';
import {Input} from '../Input';
import {PropertyPath} from '../../data/PropertyPath';

export interface InputTypeViewContext {

    formContext: FormContext;

    input: Input;

    inputConfig: Record<string, Record<string, string>[]>;

    parentDataPath: PropertyPath;
}
