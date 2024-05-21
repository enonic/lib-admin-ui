import {AiDialogControl} from './ui/AiDialogControl';
import {Element} from '../../dom/Element';
import {Store} from '../../store/Store';
import {AiTool, AiToolConfig} from './AiTool';
import {AiToolType} from './AiToolType';

const AI_ICONS_REGISTRY_KEY = 'AiIcons';

export interface AiDialogIconToolConfig extends AiToolConfig {
    aiButtonContainer: Element;
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

        this.config.pathElement.onFocusIn(() => {
            aiIcon.setDataPath(this.getDataPath()).addClass('input-focused');
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
            console.log('Creating new AI icons registry');
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
