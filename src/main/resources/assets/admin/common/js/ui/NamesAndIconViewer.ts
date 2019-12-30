import {i18n} from '../util/Messages';
import {Viewer} from './Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from '../app/NamesAndIconView';
import {NamesAndIconViewSize} from '../app/NamesAndIconViewSize';
import {ContentUnnamed} from '../content/ContentUnnamed';
import {StringHelper} from '../util/StringHelper';
import {ElementHelper} from '../dom/ElementHelper';
import {Element} from '../dom/Element';

/**
 * A parent class capable of viewing a given object with names and icon.
 */
export class NamesAndIconViewer<OBJECT>
    extends Viewer<OBJECT> {

    public static debug: boolean = false;
    protected namesAndIconView: NamesAndIconView;
    private emptyDisplayName: string = '<' + i18n('field.displayName') + '>';
    private relativePath: boolean;
    private size: NamesAndIconViewSize;

    constructor(className?: string, size: NamesAndIconViewSize = NamesAndIconViewSize.small) {
        super(className);

        this.size = size;
    }

    getCloneArgs(): any[] {
        return [this.className, this.size];
    }

    setObject(object: OBJECT, relativePath: boolean = false) {
        this.relativePath = relativePath;
        return super.setObject(object);
    }

    doLayout(object: OBJECT) {
        super.doLayout(object);

        if (NamesAndIconViewer.debug) {
            console.debug('NamesAndIconViewer.doLayout');
        }

        if (!this.namesAndIconView) {
            this.namesAndIconView = new NamesAndIconViewBuilder().setSize(this.size).build();
            this.appendChild(this.namesAndIconView);
        }

        if (object) {
            const displayName = this.resolveDisplayName(object) || this.normalizeDisplayName(this.resolveUnnamedDisplayName(object));
            const subName = this.resolveSubName(object, this.relativePath) || ContentUnnamed.prettifyUnnamed();
            const subTitle = this.resolveSubTitle(object);
            const hint = this.resolveHint(object);

            if (!StringHelper.isBlank(hint)) {
                this.getHintTargetEl().setAttribute('title', hint);
            }

            let iconUrl;
            let iconClass;
            let iconEl = this.resolveIconEl(object);
            let hideIcon = false;
            if (iconEl) {
                this.namesAndIconView.setIconEl(iconEl);
            } else {
                iconUrl = this.resolveIconUrl(object);
                if (!StringHelper.isBlank(iconUrl)) {
                    this.namesAndIconView.setIconUrl(iconUrl);
                } else {
                    iconClass = this.resolveIconClass(object);
                    if (!StringHelper.isBlank(iconClass)) {
                        this.namesAndIconView.setIconClass(iconClass);
                    } else {
                        hideIcon = true;
                    }
                }
            }
            this.namesAndIconView.toggleClass('no-icon', hideIcon);

            this.namesAndIconView.setMainName(displayName)
                .setSubName(subName, subTitle);
        }
    }

    resolveHint(_object: OBJECT): string {
        return '';
    }

    resolveDisplayName(_object: OBJECT): string {
        return '';
    }

    resolveUnnamedDisplayName(_object: OBJECT): string {
        return '';
    }

    resolveSubName(_object: OBJECT, _relativePath: boolean = false): string {
        return '';
    }

    resolveSubTitle(_object: OBJECT): string {
        return '';
    }

    resolveIconClass(_object: OBJECT): string {
        return '';
    }

    resolveIconUrl(_object: OBJECT): string {
        return '';
    }

    resolveIconEl(_object: OBJECT): Element {
        return null;
    }

    getPreferredHeight(): number {
        return 50;
    }

    getNamesAndIconView(): NamesAndIconView {
        return this.namesAndIconView;
    }

    protected getHintTargetEl(): ElementHelper {
        return this.getEl();
    }

    private normalizeDisplayName(displayName: string): string {
        if (StringHelper.isEmpty(displayName)) {
            return this.emptyDisplayName;
        } else {
            return ContentUnnamed.prettifyUnnamed(displayName);
        }
    }
}
