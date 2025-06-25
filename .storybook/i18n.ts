/// <reference types="vite/client" />
import raw from '../src/main/resources/i18n/common.properties?raw';

function parseProperties(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1);
    }
    return result;
}

export const messages = parseProperties(raw);
