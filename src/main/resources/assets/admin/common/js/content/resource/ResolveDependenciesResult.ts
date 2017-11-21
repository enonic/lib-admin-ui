module api.content.resource {

    import ContentDependencyJson = api.content.json.ContentDependencyJson;

    export interface ResolveDependenciesResultJson {

        dependencies: {key:string, value:ContentDependencyJson};

    }
    export class ResolveDependenciesResult {

        private dependencies: ResolveDependencyResult[] = [];

        public getDependencies():ResolveDependencyResult[] {
            return this.dependencies;
        }

        public static fromJson(json:ResolveDependenciesResultJson): ResolveDependenciesResult {

            const result = new ResolveDependenciesResult();

            if(json) {

                for(let id in json.dependencies) {
                    if(json.dependencies.hasOwnProperty(id)) {
                        result.getDependencies().push(new ResolveDependencyResult(new ContentId(id), json.dependencies[id]));
                    }
                }
            }

            return result;
        }
    }
}
