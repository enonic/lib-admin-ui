import {FormContext} from '../FormContext';
import {Input, type RawInputConfig} from '../Input';
import {PropertyPath} from '../../data/PropertyPath';

export interface InputTypeViewContext {

    formContext: FormContext;

    input: Input;

    inputConfig: RawInputConfig;

    parentDataPath: PropertyPath;
}
