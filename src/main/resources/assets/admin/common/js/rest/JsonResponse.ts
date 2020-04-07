import {Response} from './Response';

export class JsonResponse<RAW_JSON_TYPE>
    extends Response {

    private json: any;

    constructor(data: any) {
        super(data);
        this.json = JSON.parse(data);
    }

    isBlank(): boolean {
        return !this.json;
    }

    getJson(): any {
        return this.json;
    }

    hasResult(): boolean {
        return this.json != null;
    }

    getResult(): RAW_JSON_TYPE {
        if (!this.hasResult()) {
            return null;
        }

        if (this.json.result) {
            return <RAW_JSON_TYPE>this.json.result;
        } else {
            return <RAW_JSON_TYPE>this.json;
        }
    }
}
