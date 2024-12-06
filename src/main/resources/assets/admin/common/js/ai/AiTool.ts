
export enum AiTool {
    OPEN_AI_DIALOG,
    AI_STATE,
}

export interface AiConfig {
    group?: string;
    aiTools: AiTool[];
}
