import {PropertyPath} from '../data/PropertyPath';
import {Element} from '../dom/Element';
import {Store} from '../store/Store';
import {i18n} from '../util/Messages';
import {AiStateControl} from './AiStateControl';
import {AiHelperState} from './AiHelperState';
import {AiDialogControl} from './AiDialogControl';
import {AIContextUpdatedEvent} from './event/internal/AIContextUpdatedEvent';

export interface AiHelperConfig {
    dataPathElement: Element;
    getPath: () => PropertyPath;
    stateControl?: {
        stateContainer: Element;
        label: string;
    };
    aiButtonContainer?: Element;
}

const AI_HELPERS_KEY = 'AiHelpers';
Store.instance().set(AI_HELPERS_KEY, []);
const AI_ICONS_REGISTRY_KEY = 'AiIcons';

export class AiHelper {

    private readonly config: AiHelperConfig;

    private readonly aiStateControl?: AiStateControl;

    private state: AiHelperState = AiHelperState.DEFAULT;

    protected constructor(config: AiHelperConfig) {
        this.config = config;

        this.config.dataPathElement.onRemoved(() => {
            const helper: AiHelper[] = AiHelper.getAiHelpers() ?? [];
            Store.instance().set(AI_HELPERS_KEY, helper.filter(h => h !== this));
        });

        AiHelper.getAiHelpers().push(this);

        if (this.config.stateControl) {
            this.aiStateControl = new AiStateControl();
            this.config.stateControl.stateContainer.appendChild(this.aiStateControl);
        }

        if (this.config.aiButtonContainer) {
            this.setupAiIcon();
        }
    }

    static attach(config: AiHelperConfig): AiHelper {
        return new AiHelper(config);
    }

    static convertToPath(path: PropertyPath): string {
        return path?.toString().replace(/\./g, '/') ?? '';
    }

    static getAiHelpers(): AiHelper[] {
        return Store.instance().get(AI_HELPERS_KEY);
    }

    static setActiveContext(context: string): void {
        new AIContextUpdatedEvent(context).fire();
    }

    private setupAiIcon(): AiDialogControl {
        const aiIcon = this.getOrCreateAiIcon();

        this.config.dataPathElement.onFocus(() => {
            aiIcon.setDataPath(AiHelper.convertToPath(this.getDataPath())).addClass('input-focused');
        });

        this.config.dataPathElement.onBlur(() => aiIcon.removeClass('input-focused'));

        return aiIcon;
    }

    private getOrCreateAiIcon(): AiDialogControl {
        if (AiHelper.getOrCreateIconsRegistry().has(this.config.aiButtonContainer)) {
            return AiHelper.getOrCreateIconsRegistry().get(this.config.aiButtonContainer);
        }

        const aiIcon = new AiDialogControl();
        this.config.aiButtonContainer.appendChild(aiIcon);
        AiHelper.getOrCreateIconsRegistry().set(this.config.aiButtonContainer, aiIcon);

        return aiIcon;
    }

    private static getOrCreateIconsRegistry(): WeakMap<Element, AiDialogControl> {
        if (!Store.instance().has(AI_ICONS_REGISTRY_KEY)) {
            console.log('Creating new AI icons registry');
            Store.instance().set(AI_ICONS_REGISTRY_KEY, new WeakMap());
        }

        return Store.instance().get(AI_ICONS_REGISTRY_KEY);
    }

    setState(state: AiHelperState, data?: {text: string}): this {
        if (state === this.state) {
            return this;
        }

        this.state = state;
        this.aiStateControl?.setState(state);

        if (state === AiHelperState.COMPLETED) {
            this.resetToDefaultAfterDelay(1000);
            this.toggleProcessing(false);
        } else if (state === AiHelperState.PROCESSING) {
            this.toggleProcessing(true);
        } else if (state === AiHelperState.FAILED) {
            this.toggleProcessing(false);
            this.handleStateClick();
            this.aiStateControl?.setTitle(data?.text || '');
        }

        return this;
    }

    private resetToDefaultAfterDelay(delay: number): void {
        setTimeout(() => {
            if (this.state === AiHelperState.COMPLETED) {
                this.setState(AiHelperState.DEFAULT);
            }
        }, delay);
    }

    private toggleProcessing(isProcessing: boolean): void {
        this.config.dataPathElement.getEl().setDisabled(isProcessing);
        this.config.dataPathElement.toggleClass('ai-helper-mask', isProcessing);
        this.aiStateControl?.getEl().removeAttribute('title');

        if (isProcessing) {
            this.updateTitle();
        } else {
            this.resetTitle();
        }
    }

    private handleStateClick(): void {
        const clickHandler = () => {
            this.aiStateControl?.unClicked(clickHandler);
            this.setState(AiHelperState.DEFAULT);
        };

        this.aiStateControl?.onClicked(clickHandler);
    }

    getDataPath(): PropertyPath {
        return this.config.getPath();
    }

    getDataPathElement(): Element {
        return this.config.dataPathElement;
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
