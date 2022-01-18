type JSONValue =
    | string
    | number
    | boolean
    | JSONObject;

interface JSONObject {
    [key: string]: JSONValue;
}
