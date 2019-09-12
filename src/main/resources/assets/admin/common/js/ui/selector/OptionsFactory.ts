import * as Q from 'q';
import {OptionDataLoader} from './OptionDataLoader';
import {OptionDataHelper} from './OptionDataHelper';
import {Option} from './Option';

export class OptionsFactory<OPTION_DISPLAY_VALUE> {

    private loader: OptionDataLoader<OPTION_DISPLAY_VALUE>;

    private helper: OptionDataHelper<OPTION_DISPLAY_VALUE>;

    private readonlyChecker: (optionToCheck: OPTION_DISPLAY_VALUE) => boolean;

    constructor(loader: OptionDataLoader<OPTION_DISPLAY_VALUE>, helper: OptionDataHelper<OPTION_DISPLAY_VALUE>) {
        this.loader = loader;
        this.helper = helper;
    }

    setReadonlyChecker(checker: (optionToCheck: OPTION_DISPLAY_VALUE) => boolean) {
        this.readonlyChecker = checker;
    }

    createOptions(data: OPTION_DISPLAY_VALUE[]): Q.Promise<Option<OPTION_DISPLAY_VALUE>[]> {
        if (this.readonlyChecker) {
            return this.loader.checkReadonly(data).then((readonlyIds: string[]) => {
                return data.map((item) => this.createOption(item, this.isOptionReadonly(item, readonlyIds)));
            });
        }

        return Q(data.map((item) => this.createOption(item)));
    }

    createOption(data: OPTION_DISPLAY_VALUE, isReadonly: boolean = false): Option<OPTION_DISPLAY_VALUE> {
        return {
            value: this.helper.getDataId(data),
            expandable: this.helper.isExpandable(data),
            selectable: this.helper.isSelectable(data),
            displayValue: data,
            readOnly: isReadonly
        };
    }

    private isOptionReadonly(data: OPTION_DISPLAY_VALUE, readonlyIds: string[]): boolean {
        if (this.readonlyChecker && this.readonlyChecker(data)) {
            return true;
        }

        return readonlyIds.some((id: string) => {
            if (id === this.helper.getDataId(data)) {
                return true;
            }
        });
    }
}
