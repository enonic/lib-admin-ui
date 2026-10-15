import {FormContext} from '../FormContext';
import {Input} from '@enonic/input-types/schema';
import {type RawInputConfig} from '../Input';
import {PropertyPath} from '@enonic/input-types/data';

export interface InputTypeViewContext {

    formContext: FormContext;

    input: Input;

    inputConfig: RawInputConfig;

    parentDataPath: PropertyPath;
}
