import {FormContext} from '../FormContext';
import {Input} from '../Input';
import {PropertyPath} from '../../data/PropertyPath';
import {LabelEl} from '../../dom/LabelEl';

export interface InputTypeViewContext {

    formContext: FormContext;

    input: Input;

    inputConfig: Record<string, Record<string, string>[]>;

    parentDataPath: PropertyPath;

    labelEl?: LabelEl;
}
