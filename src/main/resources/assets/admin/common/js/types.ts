export type JSONValue =
    | string
    | number
    | boolean
    | object;

export type JSONObject = Record<string, JSONValue>;
