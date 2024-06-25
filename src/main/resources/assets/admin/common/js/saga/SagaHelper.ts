import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {SagaActionButton} from './ui/SagaActionButton';

export interface SagaHelperConfig {
    dataPathElement: Element;
    getPathFunc: () => PropertyPath;
    icon?: {
        parent: Element;
    };
}

export class SagaHelper {

    public static DATA_ATTR = 'data-path';

    private readonly config: SagaHelperConfig;

    private readonly sagaIcon?: SagaActionButton;

    constructor(config: SagaHelperConfig) {
        this.config = config;

        const updatePathCall = setInterval(() => {
            this.updateInputElDataPath();
        }, 1000);

        this.config.dataPathElement.onRemoved(() => {
            clearInterval(updatePathCall);
        });

        if (config.icon?.parent) {
            this.sagaIcon = new SagaActionButton();
            this.config.icon.parent.appendChild(this.sagaIcon);
        }
    }

    private updateInputElDataPath(): void {
        const dataPath = SagaHelper.convertToPath(this.config.getPathFunc());
        this.config.dataPathElement.getEl().setAttribute(SagaHelper.DATA_ATTR, dataPath);
        this.sagaIcon?.setDataPath(dataPath);
    }

    public static convertToPath(path: PropertyPath): string {
        return path?.toString().replace(/\./g, '/') || '';
    }
}
