import {DivEl} from '../../dom/DivEl';
import {Action} from '../../ui/Action';
import {ActionContainer} from '../../ui/ActionContainer';
import {ResponsiveManager} from '../../ui/responsive/ResponsiveManager';
import {AriaRole, WCAG} from '../../ui/WCAG';
import {i18n} from '../../util/Messages';
import {Application} from '../Application';
import {AppBarActions} from './AppBarActions';
import {AppIcon} from './AppIcon';
import {ShowAppLauncherAction} from './ShowAppLauncherAction';

export class AppBar
    extends DivEl
    implements ActionContainer, WCAG {

    [WCAG]: boolean = true;
    ariaLabel: string = i18n('wcag.appbar.label');
    role: AriaRole = AriaRole.BANNER;

    protected application: Application;

    private readonly appIcon: AppIcon;

    private readonly showAppLauncherAction: ShowAppLauncherAction;

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

    setAppName(name: string) {
        return this.appIcon.setAppName(name);
    }

    getAppIcon(): AppIcon {
        return this.appIcon;
    }

    getActions(): Action[] {
        return [this.showAppLauncherAction];
    }

    setHomeIconAction(): void {
        this.appIcon.setAction(AppBarActions.SHOW_BROWSE_PANEL);
    }

    unsetHomeIconAction(): void {
        this.appIcon.removeAction();
    }
}
