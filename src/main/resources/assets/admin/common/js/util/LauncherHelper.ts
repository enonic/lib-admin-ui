import {WidgetHelper} from '../widget/WidgetHelper';
import {Element} from '../dom/Element';
import {CONFIG} from './Config';

export class LauncherHelper {
    static appendLauncherPanel(launcherUrl?: string, container?: Element): void {
        const url = launcherUrl || CONFIG.getString('launcherUrl');
        if (!url) {
            throw new Error('Launcher URL is not defined');
        }
        fetch(url)
            .then(response => response.text())
            .then((html: string) => WidgetHelper.createFromHtmlAndAppend(html, container))
            .catch((e: Error) => {
                throw new Error(`Failed to fetch the Launcher widget at ${url}: ${e.toString()}`);
            });
    }
}
