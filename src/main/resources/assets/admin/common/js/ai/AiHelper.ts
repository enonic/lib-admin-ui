import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {Store} from '../store/Store';
import {i18n} from '../util/Messages';
import {AiControls} from './AiControls';
import {AiHelperState} from './AiHelperState';

export interface AiHelperConfig {
    dataPathElement: Element;
    getPath: () => PropertyPath;
    setValue?: (value: string) => void;
    controls?: {
        container: Element;
        label: string;
        showAiButton?: boolean;
    };
}

const AI_HELPERS_KEY = 'AiHelpers';
Store.instance().set(AI_HELPERS_KEY, []);

export class AiHelper {

    private static readonly DATA_ATTR = 'data-path';

    private readonly config: AiHelperConfig;

    private readonly aiControls?: AiControls;

    private state: AiHelperState = AiHelperState.DEFAULT;

    protected constructor(config: AiHelperConfig) {
        this.config = config;

        const updatePathCall = setInterval(() => {
            this.updateInputElDataPath();
        }, 1000);

        this.config.dataPathElement.onRemoved(() => {
            clearInterval(updatePathCall);
            const helper: AiHelper[] = Store.instance().get(AI_HELPERS_KEY) ?? [];
            Store.instance().set(AI_HELPERS_KEY, helper.filter(h => h !== this));
        });

        Store.instance().get(AI_HELPERS_KEY).push(this);

        const {controls} = this.config;
        if (controls) {
            this.aiControls = new AiControls({showAiButton: controls.showAiButton});
            controls.container.appendChild(this.aiControls);
        }
    }

    static attach(config: AiHelperConfig): AiHelper {
        return new AiHelper(config);
    }

    static convertToPath(path: PropertyPath): string {
        return path?.toString().replace(/\./g, '/') ?? '';
    }

    static getAiHelperByPath(dataPath: string): AiHelper | undefined {
        return Store.instance().get(AI_HELPERS_KEY).find((helper: AiHelper) => helper.getDataPath() === dataPath);
    }

    static getAiHelpersByParent(element: Element): AiHelper[] {
        return Store.instance().get(AI_HELPERS_KEY).filter((helper: AiHelper) => element.contains(helper.config.dataPathElement));
    }

    private updateInputElDataPath(): void {
        const dataPath = AiHelper.convertToPath(this.config.getPath());
        this.config.dataPathElement.getEl().setAttribute(AiHelper.DATA_ATTR, dataPath);
        this.aiControls?.setDataPath(dataPath);
    }

    setState(state: AiHelperState): this {
        if (state === this.state) {
            return this;
        }

        this.state = state;
        this.aiControls?.setState(state);

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
        this.config.setValue?.(value);
        return this;
    }

    getDataPath(): string {
        return this.config.dataPathElement.getEl().getAttribute(AiHelper.DATA_ATTR);
    }

    private updateTitle(): void {
        const parent = this.config.dataPathElement.getEl().getParent();

        if (parent.hasAttribute('title') && !parent.hasAttribute('data-title')) {
            parent.setAttribute('data-title', parent.getTitle());
        }

        parent.setTitle(i18n('ai.field.processing', this.config.controls?.label));
    }

    private resetTitle(): void {
        const parent = this.config.dataPathElement.getEl().getParent();
        parent.removeAttribute('title');

        if (parent.hasAttribute('data-title')) {
            parent.setTitle(parent.getAttribute('data-title'));
        }
    }
}
