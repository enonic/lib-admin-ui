export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject;

export interface JSONObject {
    [key: string]: JSONValue;
}
