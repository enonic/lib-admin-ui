module api.content.page.region {

    export class RegionDescriptor {

        private name: string;

        constructor(builder: RegionDescriptorBuilder) {
            this.name = builder.name;
        }

        getName(): string {
            return this.name;
        }

        public static create(): RegionDescriptorBuilder {
            return new RegionDescriptorBuilder();
        }

        public static fromJson(json: RegionsDescriptorJson): RegionDescriptor {
           return RegionDescriptor.create().setName(json.name).build();
        }

    }

    export class RegionDescriptorBuilder {

        name: string;

        public setName(value: string): RegionDescriptorBuilder {
            this.name = value;
            return this;
        }

        public build(): RegionDescriptor {
            return new RegionDescriptor(this);
        }
    }
}
