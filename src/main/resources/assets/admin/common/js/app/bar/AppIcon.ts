import * as Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Action} from '../../ui/Action';
import {ImgEl} from '../../dom/ImgEl';
import {SpanEl} from '../../dom/SpanEl';
import {Application} from '../Application';
import {KeyHelper} from '../../ui/KeyHelper';

export class AppIcon
    extends DivEl {

    private iconEl: ImgEl;

    private nameEl: SpanEl;

    private clickListener: () => void;

    private enterListener: (e: KeyboardEvent) => void;

    constructor(app: Application, action?: Action) {
        super('home-button');

        this.initElements(app);

        if (action) {
            this.setAction(action);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            if (this.iconEl) {
                this.appendChild(this.iconEl);
            }

            if (this.nameEl) {
                this.appendChild(this.nameEl);
            }

            return rendered;
        });
    }

    setAction(action: Action): void {
        if(!this.clickListener || !this.enterListener){
            this.initListeners(action);
        }
        this.addClass('clickable');
        this.getEl().setTabIndex(0);
        this.onClicked(this.clickListener);
        this.onKeyDown(this.enterListener);
    }

    removeAction(): void {
        this.removeClass('clickable');
        this.getEl().removeAttribute('tabindex');
        this.unClicked(this.clickListener);
        this.onKeyDown(this.enterListener);
    }

    setAppName(name: string) {
        this.nameEl.setHtml(name);
    }

    private initListeners(action): void {
        this.clickListener = () => { action.execute(); };
        this.enterListener = (e: KeyboardEvent) => { KeyHelper.isEnterKey(e) && action.execute(); };
    }

    protected initElements(app: Application): void {
        this.initIcon(app);
        this.initName(app);
    }

    protected initIcon(app: Application): void {
        if (app.getIconUrl()) {
            this.iconEl = new ImgEl(app.getIconUrl(), 'app-icon');
            if (app.getIconTooltip()) {
                this.iconEl.getEl().setTitle(app.getIconTooltip());
            }
        }
    }

    protected initName(app: Application): void {
        this.nameEl = new SpanEl('app-name');
        this.nameEl.setHtml(app.getName());
        this.appendChild(this.nameEl);
    }
}
