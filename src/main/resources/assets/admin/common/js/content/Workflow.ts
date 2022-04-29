import {WorkflowJson} from './json/WorkflowJson';
import {WorkflowState} from './WorkflowState';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class Workflow
    implements Equitable {

    private readonly state: WorkflowState;

    constructor(builder: WorkflowBuilder) {
        this.state = builder.state;
    }

    static create(): WorkflowBuilder {
        return new WorkflowBuilder();
    }

    static fromJson(json: WorkflowJson): Workflow {
        return json ? new WorkflowBuilder().fromJson(json).build() : null;
    }

    getState(): WorkflowState {
        return this.state;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Workflow)) {
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
