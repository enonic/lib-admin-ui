import {AiDialogControl} from './ui/AiDialogControl';
import {Element} from '../../dom/Element';
import {Store} from '../../store/Store';
import {AiTool, AiToolConfig} from './AiTool';
import {AiToolType} from './AiToolType';
import {AiContentOperatorOpenDialogEvent} from '../event/AiContentOperatorOpenDialogEvent';
import {AiContentOperatorSetContextEvent} from '../event/AiContentOperatorSetContextEvent';

const AI_ICONS_REGISTRY_KEY = 'AiIcons';

export interface AiDialogIconToolConfig extends AiToolConfig {
    aiButtonContainer: Element;
    setContextOnFocus?: boolean;
}

export class AiDialogIconTool extends AiTool {

    protected readonly config: AiDialogIconToolConfig;

    constructor(config: AiDialogIconToolConfig) {
        super(AiToolType.DIALOG, config);
    }

    protected initListeners(): void {
        super.initListeners();

        this.setupAiIcon();
    }

    private setupAiIcon(): AiDialogControl {
        const aiIcon = this.getOrCreateAiIcon();
        const isContextToBeSetOnFocus = !!this.config.setContextOnFocus;

        this.config.pathElement.onFocusIn(() => {
            const dataPath = this.getDataPath();
            aiIcon.setDataPath(this.getDataPath()).addClass('input-focused');

            if (isContextToBeSetOnFocus) {
                new AiContentOperatorSetContextEvent(dataPath).fire();
            }
        });

        this.config.pathElement.onFocusOut(() => aiIcon.removeClass('input-focused'));

        return aiIcon;
    }

    private getOrCreateAiIcon(): AiDialogControl {
        if (AiDialogIconTool.getOrCreateIconsRegistry().has(this.config.aiButtonContainer)) {
            return AiDialogIconTool.getOrCreateIconsRegistry().get(this.config.aiButtonContainer);
        }

        const aiIcon = new AiDialogControl(this.getDataPath());
        this.config.aiButtonContainer.appendChild(aiIcon);
        AiDialogIconTool.getOrCreateIconsRegistry().set(this.config.aiButtonContainer, aiIcon);

        return aiIcon;
    }

    private static getOrCreateIconsRegistry(): WeakMap<Element, AiDialogControl> {
        if (!Store.instance().has(AI_ICONS_REGISTRY_KEY)) {
            Store.instance().set(AI_ICONS_REGISTRY_KEY, new WeakMap());
        }

        return Store.instance().get(AI_ICONS_REGISTRY_KEY);
    }

    setActiveContext(context: string | undefined): void {
        const icon = AiDialogIconTool.getOrCreateIconsRegistry().get(this.config.aiButtonContainer);
        const thisPath = this.getDataPath();

        icon?.setActive(!!context && (icon.getDataPath() === context || thisPath === context));
        icon?.setHasActiveDescendant(context?.startsWith(icon.getDataPath()) && thisPath !== context);
    }
}
