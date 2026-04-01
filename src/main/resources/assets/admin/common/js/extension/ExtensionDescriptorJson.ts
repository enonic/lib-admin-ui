export interface ExtensionDescriptorJson {

    title: string;
    description: string;
    iconUrl: string;
    url: string;
    interfaces: string[];
    key: string;
    config: Record<string, string>;
}
