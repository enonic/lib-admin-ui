import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {Application} from './Application';

export class ApplicationKey
    implements Equitable {

    static SYSTEM: ApplicationKey = ApplicationKey.fromString('system');
    static BASE: ApplicationKey = ApplicationKey.fromString('base');
    static PORTAL: ApplicationKey = ApplicationKey.fromString('portal');
    static MEDIA: ApplicationKey = ApplicationKey.fromString('media');

    static SYSTEM_RESERVED_APPLICATION_KEYS: ApplicationKey[] = [
        ApplicationKey.SYSTEM,
        ApplicationKey.BASE,
        ApplicationKey.PORTAL,
        ApplicationKey.MEDIA,
    ];

    private name: string;

    constructor(applicationName: string) {
        this.name = applicationName;
    }

    public static fromString(applicationName: string): ApplicationKey {
        return new ApplicationKey(applicationName);
    }

    static toStringArray(keys: ApplicationKey[]): string[] {
        return keys.map((key: ApplicationKey) => key.toString());
    }

    static fromApplications(applications: Application[]): ApplicationKey[] {
        return applications.map<ApplicationKey>((mod: Application) => mod.getApplicationKey());
    }

    static fromClusterApplications(applications: Application[]): ApplicationKey[] {
        return applications
            .filter((mod: Application) => {
                return !mod.isLocal();
            })
            .map<ApplicationKey>((mod: Application) => mod.getApplicationKey());
    }

    getName(): string {
        return this.name;
    }

    isSystemReserved(): boolean {
        return ApplicationKey.SYSTEM_RESERVED_APPLICATION_KEYS.some(key => key.equals(this));
    }

    toString(): string {
        return this.name;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ApplicationKey)) {
            return false;
        }

        let other = o as ApplicationKey;
        return ObjectHelper.stringEquals(this.name, other.name);
    }
}
