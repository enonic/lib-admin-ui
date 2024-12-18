import {PropertyPath} from '../../data/PropertyPath';
import {Element} from '../../dom/Element';
import {AiToolsRegistry} from '../AiToolsRegistry';
import {AiToolType} from './AiToolType';

export interface AiToolConfig {
    group?: string;
    getPath: () => PropertyPath;
    pathElement: Element;
}

export abstract class AiTool {

    protected readonly config: AiToolConfig;

    protected readonly type: AiToolType;

    protected constructor(type: AiToolType, config: AiToolConfig) {
        this.type = type;
        this.config = config;

        AiToolsRegistry.get().add(this);
        this.initListeners();
    }

    getPropertyPath(): PropertyPath {
        return this.config.getPath();
    }

    getDataPath(): string {
        return this.getPropertyPath()?.toString().replace(/\./g, '/') ?? '';
    }

    getGroup(): string {
        return this.config.group;
    }

    getType(): AiToolType {
        return this.type;
    }

    protected initListeners(): void {
        this.config.pathElement.onRemoved(() => {
            this.cleanup();
        });
    }

    protected cleanup(): void {
        AiToolsRegistry.get().remove(this);
    }

}
