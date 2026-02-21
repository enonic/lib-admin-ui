import {withThemeByClassName} from '@storybook/addon-themes';
import {themes} from 'storybook/theming';
import type {Preview} from '@storybook/preact-vite';

import './storybook.css';

const isDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;

const preview: Preview = {
    parameters: {
        layout: 'centered',
        controls: {matchers: {color: /(background|color)$/i, date: /Date$/i}},
        docs: {theme: isDark ? themes.dark : themes.light},
    },
    decorators: [
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
