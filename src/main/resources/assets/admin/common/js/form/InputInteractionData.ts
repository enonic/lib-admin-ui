export type InputInteractionEventType = 'focus' | 'blur' | 'selection' | 'change';
export type InputInteractionDataType = 'text' | 'html';

export interface InputInteractionData {
    input: any;
    inputLabel?: string;
    inputDataType?: InputInteractionDataType;
    eventType: InputInteractionEventType;
}
