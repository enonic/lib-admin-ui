import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {AIActionButton} from './ui/AIActionButton';
import {AI_HELPER_STATE} from './AIHelperState';
import {i18n} from '../util/Messages';
import {Mask} from '../ui/mask/Mask';

export interface AIHelperConfig {
    dataPathElement: Element;
    getPathFunc: () => PropertyPath;
    icon?: {
        container: Element;
    };
    label?: string;
}

export class AIHelper {

    public static DATA_ATTR = 'data-path';

    private readonly config: AIHelperConfig;

    private readonly sagaIcon?: AIActionButton;

    private state: AI_HELPER_STATE = AI_HELPER_STATE.DEFAULT;

    private readonly mask: Mask;

    constructor(config: AIHelperConfig) {
        this.config = config;

        const updatePathCall = setInterval(() => {
            this.updateInputElDataPath();
        }, 1000);

        this.config.dataPathElement.onRemoved(() => {
            clearInterval(updatePathCall);
            AI_HELPER_REGISTRY.get().remove(this);
        });

        AI_HELPER_REGISTRY.get().add(this);

        if (config.icon?.container) {
            this.sagaIcon = new AIActionButton();
            this.config.icon.container.appendChild(this.sagaIcon);
        }

        const maskTitle = this.config.label ? i18n('ai.assistant.processing', this.config.label) : '';
        this.mask = new Mask(this.config.dataPathElement).setTitle(maskTitle).addClass('ai-helper-mask') as Mask;
    }

    private updateInputElDataPath(): void {
        const dataPath = AIHelper.convertToPath(this.config.getPathFunc());
        this.config.dataPathElement.getEl().setAttribute(AIHelper.DATA_ATTR, dataPath);
        this.sagaIcon?.setDataPath(dataPath);
    }

    setState(state: AI_HELPER_STATE): this {
        if (state === this.state) {
            return this;
        }

        this.state = state;
        this.sagaIcon?.setState(state);

        if (state === AI_HELPER_STATE.COMPLETED || state === AI_HELPER_STATE.FAILED) {
            setTimeout(() => {
                if (this.state === AI_HELPER_STATE.COMPLETED || this.state === AI_HELPER_STATE.FAILED) {
                    this.setState(AI_HELPER_STATE.DEFAULT);
                }
            }, 1000);

            this.mask.hide();
            this.config.dataPathElement.getEl().setDisabled(false);
        } else if (state === AI_HELPER_STATE.PROCESSING) {
            this.config.dataPathElement.getEl().setDisabled(true);
            this.mask.show();
        }

        return this;
    }

    setValue(value: string): this {
        // set value
        return this;
    }

    getDataPath(): string {
        return this.config.dataPathElement.getEl().getAttribute(AIHelper.DATA_ATTR);
    }

    public static convertToPath(path: PropertyPath): string {
        return path?.toString().replace(/\./g, '/') || '';
    }

    public static getAIHelperByPath(dataPath: string): AIHelper | undefined {
        return AI_HELPER_REGISTRY.get().find(dataPath);
    }
}

class AI_HELPER_REGISTRY {

    private registry: AIHelper[];

    private constructor() {
        this.registry = [];
    }

    static get(): AI_HELPER_REGISTRY {
        return window['AI_HELPER_REGISTRY'] ?? (window['AI_HELPER_REGISTRY'] = new AI_HELPER_REGISTRY());
    }

    add(helper: AIHelper): void {
        this.registry.push(helper);
    }

    remove(helper: AIHelper): void {
        this.registry = this.registry.filter(h => h !== helper);
    }

    find(dataPath: string): AIHelper | undefined {
        return this.registry.find(helper => helper.getDataPath() === dataPath);
    }
}
