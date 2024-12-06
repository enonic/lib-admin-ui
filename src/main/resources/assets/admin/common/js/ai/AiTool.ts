
export enum AiTool {
    OPEN_AI_DIALOG = 'openAiDialog',
    AI_STATE = 'aiState',
}

export interface AiConfig {
    group?: string;
    aiTools: Set<AiTool>;
}
