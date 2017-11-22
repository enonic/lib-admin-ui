module api.app.bar {

    export class AppBarTabId {

        private mode: string;

        private id: string;

        static forNew(id?: string): AppBarTabId {
            return new AppBarTabId('new', id);
        }

        static forEdit(id: string): AppBarTabId {
            return new AppBarTabId('edit', id);
        }

        static forView(id: string): AppBarTabId {
            return new AppBarTabId('view', id);
        }

        constructor(mode: string, id: string) {
            this.mode = mode;
            this.id = id;
        }

        getId(): string {
            return this.id;
        }

        getMode(): string {
            return this.mode;
        }

        equals(other: AppBarTabId): boolean {
            return other.id === this.id && other.mode === this.mode;
        }

        toString(): string {
            return this.mode + ':' + this.id;
        }
    }
}
