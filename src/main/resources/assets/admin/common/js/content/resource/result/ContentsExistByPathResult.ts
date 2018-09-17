module api.content.resource.result {

    export class ContentsExistByPathResult {

        private contentsExistMap: Object = {};

        constructor(json: api.content.json.ContentsExistByPathJson) {
            json.contentsExistJson.forEach(item => {
                this.contentsExistMap[item.contentPath] = item.exists;
            });
        }

        contentExists(path: string): boolean {
            return this.contentsExistMap.hasOwnProperty(path) && this.contentsExistMap[path];
        }
    }
}
