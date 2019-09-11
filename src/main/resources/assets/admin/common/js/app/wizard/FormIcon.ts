import {ButtonEl} from '../../dom/ButtonEl';
import {ImgEl} from '../../dom/ImgEl';

export class FormIcon
    extends ButtonEl {

    private img: ImgEl;

    constructor(iconUrl: string, className?: string) {
        super('form-icon' + (className ? ' ' + className : ''));
        let el = this.getEl();

        this.img = new ImgEl(iconUrl);

        el.appendChild(this.img.getHTMLElement());
    }

    setSrc(src: string) {
        this.img.setSrc(src);
    }
}
