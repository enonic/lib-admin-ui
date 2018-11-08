module api.ui.locale {

    import Locale = api.locale.Locale;

    export class LocaleViewer extends api.ui.Viewer<Locale> {

        private namesView: api.app.NamesView;

        private displayNamePattern: string = '{0} ({1})';

        constructor(className?: string) {
            super(className);
            this.namesView = new api.app.NamesView();
            this.appendChild(this.namesView);
        }

        setObject(locale: Locale) {
            this.namesView.setMainName(
                api.util.StringHelper.format(this.displayNamePattern, locale.getDisplayName(), locale.getProcessedTag()));

            return super.setObject(locale);
        }

        getPreferredHeight(): number {
            return 30;
        }
    }
}
