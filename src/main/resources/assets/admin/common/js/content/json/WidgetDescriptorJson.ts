export interface WidgetDescriptorJson {

    displayName: string;
    description: string;
    iconUrl: string;
    url: string;
    interfaces: string[];
    key: string;
    config: { [key: string]: string };
}
