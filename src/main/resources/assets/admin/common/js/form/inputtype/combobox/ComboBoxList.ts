import {ListBox} from '../../../ui/selector/list/ListBox';
import {ComboBoxOption} from './ComboBoxOption';
import {ComboBoxDisplayValueViewer} from './ComboBoxDisplayValueViewer';

export class ComboBoxList extends ListBox<ComboBoxOption> {
    protected createItemView(item: ComboBoxOption, readOnly: boolean): ComboBoxDisplayValueViewer {
        const viewer = new ComboBoxDisplayValueViewer();

        viewer.setObject(item.label);

        return viewer;
    }

    protected getItemId(item: ComboBoxOption): string {
        return item.value;
    }

}
