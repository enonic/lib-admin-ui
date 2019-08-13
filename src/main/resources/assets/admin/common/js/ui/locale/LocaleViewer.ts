module api.ui.locale {

    import Locale = api.locale.Locale;

    export class LocaleViewer
        extends api.ui.NamesAndIconViewer<Locale> {

        private displayNamePattern: string = '{0} ({1})';

        constructor(className?: string) {
            super(`${className || ''} locale-viewer`.trim());
        }

        resolveDisplayName(locale: Locale): string {
            return api.util.StringHelper.format(this.displayNamePattern, locale.getDisplayName(), locale.getProcessedTag());
        }

        resolveIconEl(locale: Locale): Flag {
            return new Flag(locale.getTag());
        }

        getPreferredHeight(): number {
            return 40;
        }
    }
}
