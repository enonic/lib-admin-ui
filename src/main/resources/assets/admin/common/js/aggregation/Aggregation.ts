export class Aggregation {

    private readonly name: string;

    private readonly displayName: string;

    constructor(name: string, displayName?: string) {
        this.name = name;
        this.displayName = displayName ?? name;
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

}
