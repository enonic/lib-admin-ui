import {AiHelperState} from '../AiHelperState';
import {AiStateControl} from '../AiStateControl';
import {Element} from '../../dom/Element';
import {i18n} from '../../util/Messages';
import {AiTool, AiToolConfig} from './AiTool';
import {AiToolType} from './AiToolType';

export interface AiStateToolConfig extends AiToolConfig {
    stateContainer: Element;
    label: string;
}

export class AiStateTool extends AiTool {

    declare protected readonly config: AiStateToolConfig;

    private state: AiHelperState = AiHelperState.DEFAULT;

    private readonly aiStateControl: AiStateControl;

    constructor(config: AiStateToolConfig) {
        super(AiToolType.STATE, config);
        this.aiStateControl = new AiStateControl();

        config.stateContainer.appendChild(this.aiStateControl);
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
        this.config.pathElement.getEl().setDisabled(isProcessing);
        this.config.pathElement.toggleClass('ai-helper-mask', isProcessing);
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

    private updateTitle(): void {
        const parent = this.config.pathElement.getEl().getParent();

        if (parent.hasAttribute('title') && !parent.hasAttribute('data-title')) {
            parent.setAttribute('data-title', parent.getTitle());
        }

        parent.setTitle(i18n('ai.field.processing', this.config.label));
    }

    private resetTitle(): void {
        const parent = this.config.pathElement.getEl().getParent();
        parent.removeAttribute('title');

        if (parent.hasAttribute('data-title')) {
            parent.setTitle(parent.getAttribute('data-title'));
        }
    }
}
