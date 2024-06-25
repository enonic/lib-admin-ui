import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {AIActionButton} from './ui/AIActionButton';

export interface AIHelperConfig {
    dataPathElement: Element;
    getPathFunc: () => PropertyPath;
    icon?: {
        container: Element;
    };
}

export class AIHelper {

    public static DATA_ATTR = 'data-path';

    private readonly config: AIHelperConfig;

    private readonly sagaIcon?: AIActionButton;

    constructor(config: AIHelperConfig) {
        this.config = config;

        const updatePathCall = setInterval(() => {
            this.updateInputElDataPath();
        }, 1000);

        this.config.dataPathElement.onRemoved(() => {
            clearInterval(updatePathCall);
        });

        if (config.icon?.container) {
            this.sagaIcon = new AIActionButton();
            this.config.icon.container.appendChild(this.sagaIcon);
        }
    }

    private updateInputElDataPath(): void {
        const dataPath = AIHelper.convertToPath(this.config.getPathFunc());
        this.config.dataPathElement.getEl().setAttribute(AIHelper.DATA_ATTR, dataPath);
        this.sagaIcon?.setDataPath(dataPath);
    }

    public static convertToPath(path: PropertyPath): string {
        return path?.toString().replace(/\./g, '/') || '';
    }
}
