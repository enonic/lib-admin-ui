import {withThemeByClassName} from '@storybook/addon-themes';
import type {Preview} from '@storybook/preact-vite';
import {themes} from 'storybook/theming';

import {I18nProvider} from '../src/main/resources/assets/admin/common/js/form/inputtype2/I18nContext';
import {Messages} from '../src/main/resources/assets/admin/common/js/util/Messages';
import {messages} from './i18n';
import './storybook.css';

// Populate the global singleton so i18n() calls in descriptors/logic also resolve
Messages.setMessages(messages);

const isDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;

const preview: Preview = {
    parameters: {
        layout: 'centered',
        controls: {matchers: {color: /(background|color)$/i, date: /Date$/i}},
        docs: {theme: isDark ? themes.dark : themes.light},
    },
    decorators: [
        Story => (
            <I18nProvider messages={messages}>
                <Story />
            </I18nProvider>
        ),
        withThemeByClassName({
            themes: {
                light: 'light',
                dark: 'dark',
            },
            defaultTheme: isDark ? 'dark' : 'light',
        }),
    ],
};

export default preview;
