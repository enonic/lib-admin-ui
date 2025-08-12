import Q from 'q';

export interface HttpRequest<TYPE> {

    sendAndParse(): Q.Promise<TYPE>;

}
