import {JsonRequest} from './JsonRequest';
import {UriHelper} from '../util/UriHelper';
import {HttpMethod} from './HttpMethod';

export class PostRequest
    extends JsonRequest {

    private isFormRequest: boolean = false;

    constructor() {
        super(HttpMethod.POST);
    }

    setIsFormRequest(value: boolean) {
        this.isFormRequest = value;
    }

    protected prepareRequest() {
        super.prepareRequest();
        this.request.setRequestHeader('Accept', 'application/json');
        if (!this.isFormRequest) {
            this.request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        }
    }

    protected createRequestURI(): string {
        return UriHelper.getUri(this.path.toString());
    }

    protected createRequestData(): any {
        if (this.isFormRequest) {
            return this.createFormData();
        }

        return JSON.stringify(this.params);
    }

    private createFormData(): FormData {
        const formData: FormData = new FormData();

        for (const key of Object.keys(this.params)) {
            formData.append(key, this.params[key]);
        }

        return formData;
    }
}
