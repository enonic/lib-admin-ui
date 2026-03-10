import {ExtensionHelper} from '../extension/ExtensionHelper';
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
            .then((html: string) => ExtensionHelper.createFromHtmlAndAppend(html, container))
            .catch((e: Error) => {
                throw new Error(`Failed to fetch the Launcher extension panel at ${url}: ${e.toString()}`);
            });
    }
}
