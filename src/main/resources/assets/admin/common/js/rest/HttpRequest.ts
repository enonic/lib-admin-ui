import Q = require('q');

export interface HttpRequest<TYPE> {

    sendAndParse(): Q.Promise<TYPE>;

}
