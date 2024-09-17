import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {i18n} from '../util/Messages';
import {AiHelperState} from './AiHelperState';
import {AiActionButton} from './ui/AiActionButton';

export interface AiHelperConfig {
    dataPathElement: Element;
    getPathFunc: () => PropertyPath;
    icon?: {
        container: Element;
    };
    label?: string;
    setValueFunc?: (value: string) => void;
}

export class AiHelper {

    public static DATA_ATTR = 'data-path';

    private readonly config: AiHelperConfig;

    private readonly sagaIcon?: AiActionButton;

    private state: AiHelperState = AiHelperState.DEFAULT;

    private static instances: AiHelper[] = [];

    constructor(config: AiHelperConfig) {
        this.config = config;

        const updatePathCall = setInterval(() => {
            this.updateInputElDataPath();
        }, 1000);

        this.config.dataPathElement.onRemoved(() => {
            clearInterval(updatePathCall);
            AiHelper.instances = AiHelper.instances.filter(h => h !== this);
        });

        AiHelper.instances.push(this);

        if (config.icon?.container) {
            this.sagaIcon = new AiActionButton();
            this.config.icon.container.appendChild(this.sagaIcon);
        }
    }

    private updateInputElDataPath(): void {
        const dataPath = AiHelper.convertToPath(this.config.getPathFunc());
        this.config.dataPathElement.getEl().setAttribute(AiHelper.DATA_ATTR, dataPath);
        this.sagaIcon?.setDataPath(dataPath);
    }

    setState(state: AiHelperState): this {
        if (state === this.state) {
            return this;
        }

        this.state = state;
        this.sagaIcon?.setState(state);

        if (state === AiHelperState.COMPLETED || state === AiHelperState.FAILED) {
            setTimeout(() => {
                if (this.state === AiHelperState.COMPLETED || this.state === AiHelperState.FAILED) {
                    this.setState(AiHelperState.DEFAULT);
                }
            }, 1000);

            this.config.dataPathElement.getEl().setDisabled(false);
            this.config.dataPathElement.removeClass('ai-helper-mask');
            this.resetTitle();
        } else if (state === AiHelperState.PROCESSING) {
            this.config.dataPathElement.getEl().setDisabled(true);
            this.config.dataPathElement.addClass('ai-helper-mask');
            this.updateTitle();
        }

        return this;
    }

    setValue(value: string): this {
        this.config.setValueFunc?.(value);
        return this;
    }

    getDataPath(): string {
        return this.config.dataPathElement.getEl().getAttribute(AiHelper.DATA_ATTR);
    }

    public static convertToPath(path: PropertyPath): string {
        return path?.toString().replace(/\./g, '/') || '';
    }

    public static getAiHelperByPath(dataPath: string): AiHelper | undefined {
        return AiHelper.instances.find(helper => helper.getDataPath() === dataPath);
    }

    private updateTitle(): void {
        const parent = this.config.dataPathElement.getEl().getParent();

        if (parent.hasAttribute('title') && !parent.hasAttribute('data-title')) {
            parent.setAttribute('data-title', parent.getTitle());
        }

        parent.setTitle(i18n('ai.assistant.processing', this.config.label));
    }

    private resetTitle(): void {
        const parent = this.config.dataPathElement.getEl().getParent();
        parent.removeAttribute('title');

        if (parent.hasAttribute('data-title')) {
            parent.setTitle(parent.getAttribute('data-title'));
        }
    }
}
