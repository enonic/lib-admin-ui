import {ShadowStyleLoader} from './shadow/ShadowStyleLoader';
import {ShadowScriptExecutor} from './shadow/ShadowScriptExecutor';

/**
 * Custom element that encapsulates content in Shadow DOM,
 * providing CSS isolation and JavaScript isolation via document method interception.
 *
 *
 * Usage:
 *
 * First, register your custom element (once):
 *
 *   if (!customElements.get('my-element')) {
 *     customElements.define('my-element', CustomElement);
 *   }
 *
 *   Then create an instance and append to container:
 *   const myElement = CustomElement.create('my-element');
 *   container.appendChild(myElement);
 *   await myElement.setHtml(htmlString);
 */
export class CustomElement extends HTMLElement {

    private scriptExecutor: ShadowScriptExecutor | null = null;

    // Maps CSS source URL (or CSS text) keys to their hoisted <style> element in document.head.
    // Shared across instances to avoid duplicating @font-face declarations when the same stylesheet
    // is loaded by multiple widgets simultaneously.
    private static readonly hoistedFontSources = new Map<string, HTMLStyleElement>();

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    static create<T extends typeof CustomElement>(this: T, tagName: string = 'custom-element'): InstanceType<T> {
        if (!customElements.get(tagName)) {
            // Each tag name needs its own constructor: the spec throws NotSupportedError if the
            // same constructor is registered under more than one name. An anonymous subclass
            // satisfies this requirement while still inheriting all behaviour from `this`.
            customElements.define(tagName, class extends (this as unknown as typeof HTMLElement) {} as unknown as CustomElementConstructor);
        }

        return document.createElement(tagName) as InstanceType<T>;
    }

    /**
     * Called when the element is removed from the document.
     * Cleanup is deferred by one microtask so that DOM reparenting (disconnect → connect)
     * does not accidentally destroy content: if the element is reconnected before the
     * microtask runs, isConnected will be true and cleanup is skipped.
     */
    disconnectedCallback(): void {
        Promise.resolve().then(() => {
            if (!this.isConnected) {
                this.cleanup();
            }
        });
    }

    /**
     * Sets the content of a custom component by parsing HTML, processing styles into Shadow DOM,
     * and executing scripts.
     */
    async setHtml(html: string): Promise<void> {
        // Clean up any previous content
        this.cleanup();

        // Rewrite relative url() values in inline <style data-source-href="..."> elements
        // before DOMParser sees the HTML. Those elements carry their origin URL in the attribute,
        // but only textContent is copied to the shadow root — so patching must happen first.
        html = CustomElement.resolveInlineStyleUrls(html);

        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract link elements for stylesheet processing
        const linkElements = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

        // Extract only EXECUTABLE script elements (not data scripts like type="application/json")
        // Data scripts stay in the shadow root so getElementById can find them
        const allScripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script'));
        const executableScripts = allScripts.filter(script => {
            const type = script.type?.toLowerCase() || '';
            return type !== 'application/json' &&
                   type !== 'application/ld+json' &&
                   type !== 'text/template' &&
                   type !== 'text/html';
        });

        // Remove link elements and executable scripts from the document
        // Keep data scripts in place so they end up in the shadow root
        linkElements.forEach(link => link.remove());
        executableScripts.forEach(script => script.remove());

        // Clear shadow root
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }

        // Fetch and inject stylesheets
        const styleElements = await ShadowStyleLoader.processLinkElements(linkElements);
        styleElements.forEach(style => this.shadowRoot.appendChild(style));

        // Process inline <style> elements from the parsed document
        const inlineStyles = Array.from(doc.querySelectorAll<HTMLStyleElement>('style'));
        inlineStyles.forEach(style => {
            const newStyle = document.createElement('style');
            newStyle.textContent = style.textContent;
            this.shadowRoot.appendChild(newStyle);
            style.remove();
        });

        // Append the remaining content (body content, including data scripts)
        const contentFragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => {
            contentFragment.appendChild(document.importNode(node, true));
        });
        this.shadowRoot.appendChild(contentFragment);

        // Create script executor, activate interceptors, and execute scripts.
        // Interceptors remain active until cleanup() is called (on element removal from DOM).
        this.scriptExecutor = new ShadowScriptExecutor(this.shadowRoot);
        this.scriptExecutor.activate();

        // Execute scripts in order (respecting dependencies)
        for (const scriptEl of executableScripts) {
            await this.scriptExecutor.executeScript(scriptEl);
        }

        // Rewrite relative url() values in <style data-source-href="..."> elements that
        // ShadowStyleLoader placed into the shadow root from <link> elements.
        this.resolveLinkedStyleUrls();

        // @font-face rules inside a shadow root are not reliably applied by browsers — font faces
        // must be registered at the document level. Hoist them after URLs have been made absolute.
        this.hoistFontFaceRules();
    }

    /**
     * Cleans up all resources associated with this custom element.
     * Should be called before setting new content or when the element is deactivated.
     */
    cleanup(): void {
        // scriptExecutor.cleanup() removes this instance's script tags and hoisted font-face
        // <style> elements from document.head in one go.
        if (this.scriptExecutor) {
            this.scriptExecutor.cleanup();
            this.scriptExecutor = null;
        }

        // Clear shadow root content
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
    }

    /**
     * Returns whether the custom element has content loaded.
     */
    hasContent(): boolean {
        return this.shadowRoot.childNodes.length > 0;
    }

    // Rewrites relative url() values in <style data-source-href="..."> elements that arrive inside
    // the HTML payload. Those elements carry their origin URL in the attribute, but setHtml() only
    // copies textContent into the shadow root, discarding the attribute — so patching must happen first.
    private static resolveInlineStyleUrls(html: string): string {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        let modified = false;

        doc.querySelectorAll<HTMLStyleElement>('style[data-source-href]').forEach((style) => {
            const baseHref = style.getAttribute('data-source-href');
            if (baseHref && style.textContent) {
                style.textContent = CustomElement.rewriteCssUrls(style.textContent, baseHref);
                modified = true;
            }
        });

        return modified ? doc.documentElement.outerHTML : html;
    }

    // Rewrites relative url() values in <style data-source-href="..."> elements that ShadowStyleLoader
    // has already placed into the shadow root.
    private resolveLinkedStyleUrls(): void {
        this.shadowRoot.querySelectorAll<HTMLStyleElement>('style[data-source-href]').forEach((style) => {
            const rawHref = style.getAttribute('data-source-href');
            if (!rawHref || !style.textContent) {
                return;
            }
            // data-source-href may be root-relative ("/admin/...") when ShadowStyleLoader stored it
            // from link.href in a DOMParser document (base: about:blank). Resolve against the page
            // origin so new URL(relative, base) always receives an absolute base URL.
            const baseHref = new URL(rawHref, window.location.origin).href;
            style.textContent = CustomElement.rewriteCssUrls(style.textContent, baseHref);
        });
    }

    // Extracts @font-face blocks from each shadow root <style> and injects them into document.head
    // so the browser registers the fonts at the document level where they reliably apply.
    // Uses data-source-href as a deduplication key so the same font is only hoisted once per session.
    private hoistFontFaceRules(): void {
        this.shadowRoot.querySelectorAll<HTMLStyleElement>('style').forEach((style) => {
            const cssText = style.textContent;
            if (!cssText) {
                return;
            }

            const fontFaceBlocks = cssText.match(/@font-face\s*\{[^}]*\}/gs) ?? [];
            if (!fontFaceBlocks.length) {
                return;
            }

            const key = style.getAttribute('data-source-href') ?? cssText;
            if (CustomElement.hoistedFontSources.has(key)) {
                return;
            }

            const hostStyle = document.createElement('style');
            hostStyle.textContent = fontFaceBlocks.join('\n');
            document.head.appendChild(hostStyle);
            CustomElement.hoistedFontSources.set(key, hostStyle);
            // Delegate cleanup to the script executor so fonts and scripts are always
            // removed together. The callback evicts the deduplication entry so the font
            // can be re-hoisted if the widget is reloaded after cleanup.
            this.scriptExecutor.trackFontStyle(hostStyle, () => CustomElement.hoistedFontSources.delete(key));
        });
    }

    private static rewriteCssUrls(cssText: string, baseHref: string): string {
        return cssText.replace(/url\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi, (match, quote, urlValue) => {
            if (/^(https?:|data:|\/\/|#)/.test(urlValue)) {
                return match;
            }
            try {
                return `url(${quote}${new URL(urlValue, baseHref).href}${quote})`;
            } catch {
                return match;
            }
        });
    }
}
