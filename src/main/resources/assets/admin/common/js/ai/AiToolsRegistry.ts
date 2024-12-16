import {AiTool} from './tool/AiTool';
import {Store} from '../store/Store';

const AI_TOOL_REGISTRY_KEY = 'AiHelper';

export class AiToolsRegistry {

    private readonly tools: Set<AiTool>;

    protected constructor() {
        this.tools = new Set<AiTool>();
    }

    static get(): AiToolsRegistry {
        if (!Store.instance().has(AI_TOOL_REGISTRY_KEY)) {
            Store.instance().set(AI_TOOL_REGISTRY_KEY, new AiToolsRegistry());
        }

        return Store.instance().get(AI_TOOL_REGISTRY_KEY);
    }

    getTools(): Set<AiTool> {
        return this.tools;
    }

    add(tool: AiTool): void {
        this.tools.add(tool);
    }

    remove(tool: AiTool): void {
        this.tools.delete(tool);
    }

}
