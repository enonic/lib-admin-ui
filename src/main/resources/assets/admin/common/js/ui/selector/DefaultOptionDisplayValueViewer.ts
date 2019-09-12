import {Viewer} from '../Viewer';

export class DefaultOptionDisplayValueViewer
    extends Viewer<any> {

    constructor() {
        super();
    }

    setObject(object: any) {
        this.getEl().setInnerHtml(object.toString());

        return super.setObject(object);
    }

    getPreferredHeight(): number {
        return 34;
    }
}
