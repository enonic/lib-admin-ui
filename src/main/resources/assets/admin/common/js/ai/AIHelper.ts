import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {AIActionButton} from './ui/AIActionButton';

export interface AIHelperConfig {
    dataPathElement: Element;
    getPathFunc: () => PropertyPath;
    icon?: {
        parent: Element;
        focusContainer?: Element;
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

        if (config.icon?.parent) {
            this.sagaIcon = new AIActionButton();
            this.sagaIcon.hide();
            this.config.icon.parent.appendChild(this.sagaIcon);

            const focusContainer = config.icon.focusContainer || config.icon.parent;
            focusContainer.onFocusIn((event: Event) => {
               this.sagaIcon.show();
            });

            focusContainer.onFocusOut((event: MouseEvent) => {
                if (event.relatedTarget !== this.sagaIcon.getHTMLElement()) {
                    this.sagaIcon.hide();
                }
            });
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
