module api.content {

    import WorkflowJson = api.content.json.WorkflowJson;
    import WorkflowState = api.content.WorkflowState;

    export class Workflow
        implements api.Equitable {

        private state: WorkflowState;

        constructor(builder: WorkflowBuilder) {
            this.state = builder.state;
        }

        getState(): WorkflowState {
            return this.state;
        }

        getStateAsString(): string {
            return WorkflowState[this.state].toLowerCase();
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, Workflow)) {
                return false;
            }

            const other = <Workflow>o;

            return this.state === other.getState();
        }

        toJson(): WorkflowJson {
            return {
                state: WorkflowState[this.state],
                checks: {}
            };
        }

        newBuilder(): WorkflowBuilder {
            return new WorkflowBuilder(this);
        }

        static create(): WorkflowBuilder {
            return new WorkflowBuilder();
        }

        static fromJson(json: WorkflowJson): Workflow {
            return json ? new WorkflowBuilder().fromJson(json).build() : null;
        }
    }

    export class WorkflowBuilder {

        state: WorkflowState;

        constructor(source?: Workflow) {
            if (source) {
                this.state = source.getState();
            }
        }

        fromJson(json: WorkflowJson): WorkflowBuilder {
            this.state = WorkflowState[json.state];

            return this;
        }

        setState(state: WorkflowState): WorkflowBuilder {
            this.state = state;
            return this;
        }

        build(): Workflow {
            return new Workflow(this);
        }

    }
}
