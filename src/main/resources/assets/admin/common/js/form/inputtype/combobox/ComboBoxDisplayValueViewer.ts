import {Viewer} from '../../../ui/Viewer';

export class ComboBoxDisplayValueViewer
    extends Viewer<string> {

    constructor() {
        super();
    }

    setObject(value: string) {
        this.getEl().setInnerHtml(value);

        return super.setObject(value);
    }

}
