
export enum AiTool {
    OPEN_AI_DIALOG,
    AI_STATE,
}

export interface AiConfig {
    context?: string;
    aiTools: AiTool[];
}
