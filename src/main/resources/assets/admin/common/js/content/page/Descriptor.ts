module api.content.page {

    export class Descriptor implements api.Cloneable {

        private key: DescriptorKey;

        private name: DescriptorName;

        private displayName: string;

        private description: string;

        private config: api.form.Form;

        constructor(builder: DescriptorBuilder) {
            this.name = builder.name;
            this.key = builder.key;
            this.displayName = builder.displayName;
            this.description = builder.description;
            this.config = builder.config;
        }

        static fromJson(json: DescriptorJson): Descriptor {
            return DescriptorBuilder.fromJson(json).build();
        }

        getKey(): DescriptorKey {
            return this.key;
        }

        getName(): DescriptorName {
            return this.name;
        }

        getDisplayName(): string {
            return this.displayName;
        }

        getDescription(): string {
            return this.description;
        }

        getConfig(): api.form.Form {
            return this.config;
        }

        getIconCls(): string {
            return '';
        }

        clone(): Descriptor {
            return new DescriptorBuilder(this).build();
        }
    }

    export class DescriptorBuilder {

        key: DescriptorKey;

        name: DescriptorName;

        displayName: string;

        description: string;

        config: api.form.Form;

        constructor(source?: Descriptor) {
            if (source) {
                this.key = source.getKey();
                this.name = source.getName();
                this.displayName = source.getDisplayName();
                this.description = source.getDescription();
                this.config = source.getConfig();
            }
        }
    }

}
