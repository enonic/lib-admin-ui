import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {Store} from '../store/Store';
import {i18n} from '../util/Messages';
import {AiStateControl} from './AiStateControl';
import {AiHelperState} from './AiHelperState';
import {AiDialogControl} from './AiDialogControl';

export interface AiHelperConfig {
    dataPathElement: Element;
    getPath: () => PropertyPath;
    setValue?: (value: string) => void;
    stateControl?: {
        stateContainer: Element;
        label: string;
    };
    aiButtonContainer?: Element;
}

const AI_HELPERS_KEY = 'AiHelpers';
Store.instance().set(AI_HELPERS_KEY, []);

export class AiHelper {

    private static readonly DATA_ATTR = 'data-path';

    private static DIALOG_CONTROL_REGISTRY = new Map<Element, AiDialogControl>();

    private readonly config: AiHelperConfig;

    private readonly aiStateControl?: AiStateControl;

    private readonly aiDialogControl?: AiDialogControl;

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

        if (this.config.stateControl) {
            this.aiStateControl = new AiStateControl();
            this.config.stateControl.stateContainer.appendChild(this.aiStateControl);
        }

        if (this.config.aiButtonContainer) {
            this.aiDialogControl = this.setupAiIcon();
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

        if (this.config.dataPathElement.hasFocus()) {
            this.aiDialogControl?.setDataPath(dataPath);
        }
    }

    private setupAiIcon(): AiDialogControl {
        const aiIcon = this.getOrCreateAiIcon();

        this.config.dataPathElement.onFocus(() => {
            aiIcon.setDataPath(this.getDataPath()).addClass('input-focused');
        });

        this.config.dataPathElement.onBlur(() => aiIcon.removeClass('input-focused'));

        return aiIcon;
    }

    private getOrCreateAiIcon(): AiDialogControl {
        if (AiHelper.DIALOG_CONTROL_REGISTRY.has(this.config.aiButtonContainer)) {
            return AiHelper.DIALOG_CONTROL_REGISTRY.get(this.config.aiButtonContainer);
        }

        const aiIcon = new AiDialogControl();
        this.config.aiButtonContainer.appendChild(aiIcon);
        AiHelper.DIALOG_CONTROL_REGISTRY.set(this.config.aiButtonContainer, aiIcon);

        return aiIcon;
    }

    setState(state: AiHelperState): this {
        if (state === this.state) {
            return this;
        }

        this.state = state;
        this.aiStateControl?.setState(state);

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

        parent.setTitle(i18n('ai.field.processing', this.config.stateControl?.label));
    }

    private resetTitle(): void {
        const parent = this.config.dataPathElement.getEl().getParent();
        parent.removeAttribute('title');

        if (parent.hasAttribute('data-title')) {
            parent.setTitle(parent.getAttribute('data-title'));
        }
    }
}
