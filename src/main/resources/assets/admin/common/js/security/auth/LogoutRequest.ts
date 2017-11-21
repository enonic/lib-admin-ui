module api.security.auth {

    export class LogoutRequest extends AuthResourceRequest<LogoutResultJson, void> {

        constructor() {
            super();
            super.setMethod('POST');
        }

        getParams(): Object {
            return {};
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'logout');
        }

        sendAndParse(): wemQ.Promise<void> {
            this.send();

            return wemQ<void>(null);
        }

    }
}
