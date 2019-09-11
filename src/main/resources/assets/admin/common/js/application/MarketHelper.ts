import {MarketApplication} from './MarketApplication';
import {Application} from './Application';

export class MarketHelper {

    static installedAppCanBeUpdated(marketApp: MarketApplication, installedApp: Application): boolean {
        return this.compareVersionNumbers(marketApp.getLatestVersion(), installedApp.getVersion()) > 0;
    }

    private static compareVersionNumbers(v1: string, v2: string): number {
        let v1parts = v1.split('.').map((el) => {
            return parseInt(el, 10);
        });
        let v2parts = v2.split('.').map((el) => {
            return parseInt(el, 10);
        });

        for (let i = 0; i < v1parts.length; ++i) {
            if (v2parts.length === i) {
                return 1;
            }

            if (v1parts[i] === v2parts[i]) {
                continue;
            }
            if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            return -1;
        }

        if (v1parts.length !== v2parts.length) {
            return -1;
        }

        return 0;
    }
}
