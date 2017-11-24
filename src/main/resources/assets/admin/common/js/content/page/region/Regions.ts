module api.content.page.region {

    export class Regions
        implements api.Equitable {

        public static debug: boolean = false;

        private regionByName: { [s: string]: Region; } = {};

        private changedListeners: { (event: RegionsChangedEvent): void }[] = [];

        private componentPropertyChangedListeners: { (event: ComponentPropertyChangedEvent): void }[] = [];

        private regionChangedListeners: { (event: RegionChangedEvent): void }[] = [];

        private regionAddedListeners: { (event: RegionAddedEvent): void }[] = [];

        private regionRemovedListeners: { (event: RegionRemovedEvent): void }[] = [];

        private regionChangedEventHandler: (event: any) => void;

        private componentPropertyChangedEventHandler: (event: any) => void;

        constructor(builder: RegionsBuilder) {

            this.regionChangedEventHandler = (event) => this.notifyRegionChanged(event.getPath());
            this.componentPropertyChangedEventHandler = (event) => this.forwardComponentPropertyChangedEvent(event);

            builder.regions.forEach((region: Region) => {
                if (this.regionByName[region.getName()] != null) {
                    throw new Error('Regions must be unique by name, duplicate found: ' + region.getName());
                }

                this.addRegion(region);
            });
        }

        mergeRegions(descriptorRegions: RegionDescriptor[], parent: LayoutComponent): Regions {
            return new LayoutRegionsMerger().merge(this, descriptorRegions, parent);
        }

        addRegion(region: Region) {

            this.regionByName[region.getName()] = region;

            this.notifyRegionAdded(region.getPath());
            this.registerRegionListeners(region);
        }

        private registerRegionListeners(region: Region) {
            region.onChanged(this.regionChangedEventHandler);
            region.onComponentPropertyChangedEvent(this.componentPropertyChangedEventHandler);
        }

        private unregisterRegionListeners(region: Region) {
            region.unChanged(this.regionChangedEventHandler);
            region.unComponentPropertyChangedEvent(this.componentPropertyChangedEventHandler);
        }

        removeRegions(regions: Region[]) {
            regions.forEach((region: Region) => {
                delete this.regionByName[region.getName()];

                this.notifyRegionRemoved(region.getPath());
                this.unregisterRegionListeners(region);
            });
        }

        getRegions(): Region[] {
            let regions = [];
            for (const name in this.regionByName) {
                if (this.regionByName.hasOwnProperty(name)) {
                    regions.push(this.regionByName[name]);
                }
            }
            return regions;
        }

        getRegionByName(name: string): Region {

            return this.regionByName[name];
        }

        getComponent(path: ComponentPath): Component {

            let first: ComponentPathRegionAndComponent = path.getFirstLevel();
            let region = this.getRegionByName(first.getRegionName());
            let component = region.getComponentByIndex(first.getComponentIndex());

            if (path.numberOfLevels() === 1) {
                return component;
            } else {
                if (!api.ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
                    throw new Error('Expected component to be a LayoutComponent: ' + api.ClassHelper.getClassName(component));
                }

                let layoutComponent = <LayoutComponent> component;
                return layoutComponent.getComponent(path.removeFirstLevel());
            }
        }

        /**
         * Keeps existing regions (including components) if they are listed in given regionDescriptors.
         * Removes others and adds those missing.
         * @param regionDescriptors
         */
        changeRegionsTo(regionDescriptors: RegionDescriptor[]) {

            // Remove regions not existing in regionDescriptors
            let regionsToRemove: Region[] = this.getRegions().filter((region: Region) => {
                return !regionDescriptors.some((regionDescriptor: RegionDescriptor) => {
                    return regionDescriptor.getName() === region.getName();
                });
            });
            this.removeRegions(regionsToRemove);

            // Add missing regions
            regionDescriptors.forEach((regionDescriptor: RegionDescriptor) => {
                let region = this.getRegionByName(regionDescriptor.getName());
                if (!region) {
                    region = Region.create().setName(regionDescriptor.getName()).build();
                    this.addRegion(region);
                }
            });
        }

        public toJson(): RegionJson[] {

            let regionJsons: RegionJson[] = [];
            this.getRegions().forEach((region: Region) => {
                regionJsons.push(region.toJson());
            });
            return regionJsons;
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, Regions)) {
                return false;
            }

            let other = <Regions>o;

            let thisRegions = this.getRegions();
            let otherRegions = other.getRegions();

            if (!api.ObjectHelper.arrayEquals(thisRegions, otherRegions)) {
                return false;
            }

            return true;
        }

        clone(): Regions {
            return new RegionsBuilder(this).build();
        }

        onChanged(listener: (event: BaseRegionChangedEvent) => void) {
            this.changedListeners.push(listener);
        }

        unChanged(listener: (event: BaseRegionChangedEvent) => void) {
            this.changedListeners =
                this.changedListeners.filter((curr: (event: BaseRegionChangedEvent) => void) => {
                    return listener !== curr;
                });
        }

        private notifyChanged(event: RegionsChangedEvent) {
            if (Regions.debug) {
                console.debug('Regions.notifyChanged');
            }
            this.changedListeners.forEach((listener: (event: RegionsChangedEvent) => void) => {
                listener(event);
            });
        }

        onComponentPropertyChanged(listener: (event: ComponentPropertyChangedEvent) => void) {
            this.componentPropertyChangedListeners.push(listener);
        }

        unComponentPropertyChanged(listener: (event: ComponentPropertyChangedEvent) => void) {
            this.componentPropertyChangedListeners =
                this.componentPropertyChangedListeners.filter((curr: (event: ComponentPropertyChangedEvent) => void) => {
                    return listener !== curr;
                });
        }

        private forwardComponentPropertyChangedEvent(event: ComponentPropertyChangedEvent): void {
            this.componentPropertyChangedListeners.forEach((listener: (event: ComponentPropertyChangedEvent) => void) => {
                listener(event);
            });
        }

        onRegionChanged(listener: (event: RegionChangedEvent) => void) {
            this.regionChangedListeners.push(listener);
        }

        unRegionChanged(listener: (event: RegionChangedEvent) => void) {
            this.regionChangedListeners =
                this.regionChangedListeners.filter((curr: (event: RegionChangedEvent) => void) => {
                    return listener !== curr;
                });
        }

        private notifyRegionChanged(regionPath: RegionPath): void {
            let event = new RegionChangedEvent(regionPath);
            if (Regions.debug) {
                console.debug('Regions.notifyRegionChanged: ' + event.getRegionPath().toString());
            }
            this.regionChangedListeners.forEach((listener: (event: RegionChangedEvent) => void) => {
                listener(event);
            });
            this.notifyChanged(event);
        }

        onRegionAdded(listener: (event: RegionAddedEvent) => void) {
            this.regionAddedListeners.push(listener);
        }

        unRegionAdded(listener: (event: RegionAddedEvent) => void) {
            this.regionAddedListeners =
                this.regionAddedListeners.filter((curr: (event: RegionAddedEvent) => void) => {
                    return listener !== curr;
                });
        }

        private notifyRegionAdded(regionPath: RegionPath) {
            let event = new RegionAddedEvent(regionPath);
            if (Regions.debug) {
                console.debug('Regions.notifyRegionAdded: ' + event.getRegionPath().toString());
            }
            this.regionAddedListeners.forEach((listener: (event: RegionAddedEvent) => void) => {
                listener(event);
            });
            this.notifyChanged(event);
        }

        onRegionRemoved(listener: (event: RegionRemovedEvent) => void) {
            this.regionRemovedListeners.push(listener);
        }

        unRegionRemoved(listener: (event: RegionRemovedEvent) => void) {
            this.regionRemovedListeners =
                this.regionRemovedListeners.filter((curr: (event: RegionRemovedEvent) => void) => {
                    return listener !== curr;
                });
        }

        private notifyRegionRemoved(regionPath: RegionPath) {
            let event = new RegionRemovedEvent(regionPath);
            if (Regions.debug) {
                console.debug('Regions.notifyRegionRemoved: ' + event.getRegionPath().toString());
            }
            this.regionRemovedListeners.forEach((listener: (event: RegionRemovedEvent) => void) => {
                listener(event);
            });
            this.notifyChanged(event);
        }

        public static create(): RegionsBuilder {

            return new RegionsBuilder();
        }

        public static fromJson(regionsJson: RegionJson[], parent: LayoutComponent): Regions {

            return Regions.create().setRegions(regionsJson.map((regionJson: RegionJson) => {
                const region = Region.create().setName(regionJson.name).setParent(parent).build();

                regionJson.components.forEach((componentJson: ComponentTypeWrapperJson, componentIndex: number) => {
                    let component: Component = ComponentFactory.createFromJson(componentJson, componentIndex, region);
                    region.addComponent(component);
                });

                return region;
            })).build();
        }
    }

    export class RegionsBuilder {

        regions: Region[] = [];

        constructor(source?: Regions) {
            if (source) {
                source.getRegions().forEach((region: Region) => {
                    this.regions.push(region.clone());
                });
            }
        }

        addRegion(value: Region): RegionsBuilder {
            this.regions.push(value);
            return this;
        }

        setRegions(value: Region[]): RegionsBuilder {
            this.regions = value;
            return this;
        }

        public build(): Regions {
            return new Regions(this);
        }
    }

}
