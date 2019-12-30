import {DivEl} from '../../dom/DivEl';
import {ActionContainer} from '../../ui/ActionContainer';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {Action} from '../../ui/Action';
import {ImgEl} from '../../dom/ImgEl';
import {SpanEl} from '../../dom/SpanEl';
import {ShowAppLauncherAction} from './ShowAppLauncherAction';
import {AppBarActions} from './AppBarActions';
import {Application} from '../Application';

export class AppBar
    extends DivEl
    implements ActionContainer {

    protected application: Application;

    private appIcon: AppIcon;

    private showAppLauncherAction: ShowAppLauncherAction;

    constructor(application: Application) {
        super('appbar');

        this.application = application;

        this.showAppLauncherAction = new ShowAppLauncherAction(this.application);

        this.appIcon = new AppIcon(this.application);
        this.appendChild(this.appIcon);

        this.onRendered(() => {
            ResponsiveManager.fireResizeEvent();
        });

    }

    getActions(): Action[] {
        return [this.showAppLauncherAction];
    }

    setHomeIconAction() {
        this.appIcon.setAction(AppBarActions.SHOW_BROWSE_PANEL);
    }
}

export class AppIcon
    extends DivEl {

    constructor(app: Application, action?: Action) {

        super('home-button');

            if (app.getIconUrl()) {
                const icon = new ImgEl(app.getIconUrl(), 'app-icon');
                if (app.getIconTooltip()) {
                    icon.getEl().setTitle(app.getIconTooltip());
                }
                this.appendChild(icon);
            }

            const span = new SpanEl('app-name');
            span.setHtml(app.getName());
            this.appendChild(span);

        if (action) {
            this.setAction(action);
        }
    }

    setAction(action: Action) {
        this.addClass('clickable');
        this.onClicked(() => action.execute());
    }

}
