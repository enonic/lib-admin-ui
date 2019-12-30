import {Response} from './Response';

export class JsonResponse<RAW_JSON_TYPE>
    extends Response {

    private json: any;

    constructor(json: any) {
        super();
        this.json = JSON.parse(json);
    }

    isBlank(): boolean {
        return !this.json;
    }

    getJson(): any {
        return this.json;
    }

    hasResult(): boolean {
        if (this.json == null || this.json == null) {
            return false;
        }
        return true;
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
