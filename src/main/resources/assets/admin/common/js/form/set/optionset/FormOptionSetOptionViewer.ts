import {FormOptionSetOption} from './FormOptionSetOption';
import {NamesAndIconViewer} from '../../../ui/NamesAndIconViewer';
import {i18n} from '../../../util/Messages';

export class FormOptionSetOptionViewer
    extends NamesAndIconViewer<FormOptionSetOption> {

    constructor() {
        super('optionset-option-viewer');
    }

    resolveDisplayName(_object: FormOptionSetOption): string {
        return _object.getLabel();
    }

    resolveSubName(_object: FormOptionSetOption): string {
        return _object.getHelpText() || i18n('text.noDescription');
    }
}

