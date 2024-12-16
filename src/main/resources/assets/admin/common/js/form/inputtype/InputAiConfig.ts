import {AiToolType} from '../../ai/tool/AiToolType';

export interface AiConfig {
    group?: string;
    aiTools: Set<AiToolType>;
}
