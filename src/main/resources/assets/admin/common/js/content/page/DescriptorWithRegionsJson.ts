module api.content.page {

    export interface DescriptorWithRegionsJson extends DescriptorJson {

        regions: api.content.page.region.RegionsDescriptorJson[];

    }
}
