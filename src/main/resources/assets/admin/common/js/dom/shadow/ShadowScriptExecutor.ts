/**
 * Handles script execution within Shadow DOM.
 *
 * Interceptors are installed once via activate() and remain active until cleanup() is called.
 * This ensures that async callbacks (setTimeout, setInterval) can still query the shadow root
 * after initial script execution completes.
 *
 * Scripts and hoisted font-face <style> elements executed/injected by this instance are tagged
 * with a unique instance ID so that cleanup() removes only this element's assets from document.head.
 */
export class ShadowScriptExecutor {

    private readonly shadowRoot: ShadowRoot;

    private readonly instanceId: string = `shadow-executor-${Math.random().toString(36).slice(2)}`;

    private readonly scriptElements: HTMLScriptElement[] = [];

    private readonly fontStyleElements: {el: HTMLStyleElement; onRemove?: () => void}[] = [];

    private readonly timeouts = new Set<number>();

    private readonly intervals = new Set<number>();

    // Store original document methods for restoration
    private static originalMethods: {
        querySelector: typeof document.querySelector;
        querySelectorAll: typeof document.querySelectorAll;
        getElementById: typeof document.getElementById;
        getElementsByClassName: typeof document.getElementsByClassName;
        getElementsByTagName: typeof document.getElementsByTagName;
        setTimeout: typeof window.setTimeout;
        setInterval: typeof window.setInterval;
    } | null = null;

    private static activeExecutor: ShadowScriptExecutor | null = null;

    // Counts how many executors currently have interceptors installed.
    // Interceptors are only torn down when this reaches zero.
    // NOTE: When multiple executors run concurrently, activeExecutor points to the most
    // recently started one, so document queries may be routed to the wrong shadow root.
    // Fully correct per-execution routing would require per-async-context tracking, which
    // is not available in browsers. Concurrent extension loading is therefore a known limitation.
    private static activeExecutorCount: number = 0;

    constructor(shadowRoot: ShadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    /**
     * Activates this executor by installing document method interceptors.
     * Call once after creating the executor and before executing scripts.
     * Interceptors remain active until cleanup() is called.
     */
    activate(): void {
        this.installInterceptors();
    }

    /**
     * Installs document method interceptors that redirect queries to the shadow root.
     */
    private installInterceptors(): void {
        if (ShadowScriptExecutor.originalMethods) {
            // Interceptors already installed by a concurrent executor — just increment the
            // ref-count and update the active executor pointer.
            ShadowScriptExecutor.activeExecutorCount++;
            ShadowScriptExecutor.activeExecutor = this;
            return;
        }

        // Store original methods and property descriptors
        const originalSetTimeout = window.setTimeout.bind(window);
        const originalSetInterval = window.setInterval.bind(window);

        ShadowScriptExecutor.originalMethods = {
            querySelector: document.querySelector.bind(document),
            querySelectorAll: document.querySelectorAll.bind(document),
            getElementById: document.getElementById.bind(document),
            getElementsByClassName: document.getElementsByClassName.bind(document),
            getElementsByTagName: document.getElementsByTagName.bind(document),
            setTimeout: originalSetTimeout,
            setInterval: originalSetInterval,
        };

        ShadowScriptExecutor.activeExecutorCount = 1;
        ShadowScriptExecutor.activeExecutor = this;

        const getActiveShadowRoot = () => ShadowScriptExecutor.activeExecutor?.shadowRoot;

        // Helper to check if selector targets script elements.
        // Matches 'script' as a type selector token, avoiding false positives
        // for substrings like 'noscript', '.script-class', '#script-id', '[data-script]'.
        const isScriptSelector = (selectors: string): boolean => {
            return /(?:^|[\s>+~,])script(?:$|[\s.[:#,>+~\]])/i.test(selectors);
        };

        // Override querySelector
        document.querySelector = function <K extends keyof HTMLElementTagNameMap> (selectors: K | string): HTMLElementTagNameMap[K] | Element | null {
            const shadowRoot = getActiveShadowRoot();
            // Don't intercept script queries - scripts are in document.head
            if (shadowRoot && !isScriptSelector(String(selectors))) {
                const result = shadowRoot.querySelector(selectors);
                if (result) {
                    return result;
                }
            }
            return ShadowScriptExecutor.originalMethods.querySelector.call(document, selectors);
        };

        // Override querySelectorAll
        document.querySelectorAll = function <K extends keyof HTMLElementTagNameMap> (selectors: K | string): NodeListOf<HTMLElementTagNameMap[K] | Element> {
            const shadowRoot = getActiveShadowRoot();
            // Don't intercept script queries - scripts are in document.head
            if (shadowRoot && !isScriptSelector(String(selectors))) {
                const results = shadowRoot.querySelectorAll(selectors);
                if (results.length > 0) {
                    return results;
                }
            }
            return ShadowScriptExecutor.originalMethods.querySelectorAll.call(document, selectors);
        };

        // Override getElementById
        document.getElementById = function (elementId: string): HTMLElement | null {
            const shadowRoot = getActiveShadowRoot();
            if (shadowRoot) {
                const result = shadowRoot.getElementById(elementId);
                if (result) {
                    return result;
                }
            }
            return ShadowScriptExecutor.originalMethods.getElementById.call(document, elementId);
        };

        // Override getElementsByClassName
        document.getElementsByClassName = function (classNames: string): HTMLCollectionOf<Element> {
            const shadowRoot = getActiveShadowRoot();
            if (shadowRoot) {
                // Shadow root lacks getElementsByClassName; querySelectorAll returns a static
                // NodeList (not a live HTMLCollection). Code relying on live-collection
                // behaviour will not update automatically.
                const selector = '.' + classNames.trim().split(/\s+/).join('.');
                const elements = shadowRoot.querySelectorAll(selector);
                if (elements.length > 0) {
                    return elements as unknown as HTMLCollectionOf<Element>;
                }
            }
            return ShadowScriptExecutor.originalMethods.getElementsByClassName.call(document, classNames);
        };

        // Override getElementsByTagName
        document.getElementsByTagName = function <K extends keyof HTMLElementTagNameMap> (qualifiedName: K | string): HTMLCollectionOf<HTMLElementTagNameMap[K] | Element> {
            const shadowRoot = getActiveShadowRoot();
            if (shadowRoot) {
                const results = shadowRoot.querySelectorAll(qualifiedName);
                if (results.length > 0) {
                    return results as unknown as HTMLCollectionOf<HTMLElementTagNameMap[K] | Element>;
                }
            }
            return ShadowScriptExecutor.originalMethods.getElementsByTagName.call(document, qualifiedName) as HTMLCollectionOf<HTMLElementTagNameMap[K] | Element>;
        };

        // Override window.setTimeout/setInterval so async callbacks run with interceptors active.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).setTimeout = (fn: TimerHandler, delay?: number, ...args: unknown[]): number => {
            const executor = ShadowScriptExecutor.activeExecutor;
            if (executor) {
                return executor.trackTimeout(fn, delay, ...args);
            }
            return originalSetTimeout(fn, delay, ...args);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).setInterval = (fn: TimerHandler, delay?: number, ...args: unknown[]): number => {
            const executor = ShadowScriptExecutor.activeExecutor;
            if (executor) {
                return executor.trackInterval(fn, delay, ...args);
            }
            return originalSetInterval(fn, delay, ...args);
        };
    }

    /**
     * Removes document method interceptors and restores original behavior.
     */
    private removeInterceptors(): void {
        if (ShadowScriptExecutor.activeExecutor === this) {
            ShadowScriptExecutor.activeExecutor = null;
        }

        ShadowScriptExecutor.activeExecutorCount = Math.max(0, ShadowScriptExecutor.activeExecutorCount - 1);

        // Only restore original methods when the last concurrent executor has finished.
        if (ShadowScriptExecutor.activeExecutorCount === 0 && ShadowScriptExecutor.originalMethods) {
            document.querySelector = ShadowScriptExecutor.originalMethods.querySelector;
            document.querySelectorAll = ShadowScriptExecutor.originalMethods.querySelectorAll;
            document.getElementById = ShadowScriptExecutor.originalMethods.getElementById;
            document.getElementsByClassName = ShadowScriptExecutor.originalMethods.getElementsByClassName;
            document.getElementsByTagName = ShadowScriptExecutor.originalMethods.getElementsByTagName;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).setTimeout = ShadowScriptExecutor.originalMethods.setTimeout;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).setInterval = ShadowScriptExecutor.originalMethods.setInterval;

            ShadowScriptExecutor.originalMethods = null;
        }
    }

    /**
     * Executes a script element.
     * Scripts are appended to document.head for proper execution,
     * but DOM queries are intercepted to redirect to the shadow root.
     * Interceptors must be installed via activate() before calling this method.
     */
    executeScript(scriptEl: HTMLScriptElement): Promise<void> {
        return new Promise((resolve) => {
            const newScript = document.createElement('script');

            // Copy ALL attributes from original script (including data-* attributes)
            // This is important for extensions that use document.currentScript.getAttribute()
            for (const attr of Array.from(scriptEl.attributes)) {
                newScript.setAttribute(attr.name, attr.value);
            }

            // Tag with instance ID so cleanup() removes only this element's scripts
            newScript.setAttribute('data-extension-script-id', this.instanceId);

            if (scriptEl.src) {
                // External script - add cache-busting for modules to ensure re-execution
                let srcUrl = scriptEl.src;
                if (scriptEl.type === 'module') {
                    const separator = srcUrl.includes('?') ? '&' : '?';
                    srcUrl = `${srcUrl}${separator}_cb=${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
                }
                newScript.src = srcUrl;

                newScript.onload = () => resolve();
                newScript.onerror = () => {
                    console.warn(`ShadowScriptExecutor: Failed to load script: ${scriptEl.src}`);
                    resolve();
                };
            } else {
                // Inline script - wrap to redirect document access
                const originalCode = scriptEl.textContent || '';
                newScript.textContent = this.wrapScriptCode(originalCode);
            }

            // Track for cleanup
            this.scriptElements.push(newScript);

            // Append to document.head for proper execution
            // (scripts in shadow DOM don't execute reliably)
            document.head.appendChild(newScript);

            // For inline scripts, execution is synchronous (but modules are async)
            if (!scriptEl.src && scriptEl.type !== 'module') {
                resolve();
            }

            // For module scripts without src, they're async so resolve after a tick.
            // Use the stored original setTimeout to avoid triggering the tracked override.
            if (!scriptEl.src && scriptEl.type === 'module') {
                const originalSetTimeout = ShadowScriptExecutor.originalMethods?.setTimeout ?? window.setTimeout.bind(window);
                originalSetTimeout(() => resolve(), 0);
            }
        });
    }

    /**
     * Wraps script code to set up the execution context.
     */
    private wrapScriptCode(code: string): string {
        // The interceptors are already installed globally, so the code will
        // automatically have its document queries redirected to the shadow root.
        // We wrap in an IIFE to provide a clean scope.
        return `(function() {
    ${code}
})();`;
    }

    /**
     * Creates tracked setTimeout that can be cleaned up.
     * Uses the original (pre-override) window.setTimeout to avoid recursion.
     */
    trackTimeout(fn: TimerHandler, delay?: number, ...args: unknown[]): number {
        const originalSetTimeout = ShadowScriptExecutor.originalMethods?.setTimeout ?? window.setTimeout.bind(window);
        const id = originalSetTimeout(() => {
            this.timeouts.delete(id);
            if (typeof fn === 'function') {
                fn(...args);
            }
        }, delay) as number;
        this.timeouts.add(id);
        return id;
    }

    /**
     * Creates tracked setInterval that can be cleaned up.
     * Uses the original (pre-override) window.setInterval to avoid recursion.
     */
    trackInterval(fn: TimerHandler, delay?: number, ...args: unknown[]): number {
        const originalSetInterval = ShadowScriptExecutor.originalMethods?.setInterval ?? window.setInterval.bind(window);
        const id = originalSetInterval(() => {
            if (typeof fn === 'function') {
                fn(...args);
            }
        }, delay) as number;
        this.intervals.add(id);
        return id;
    }

    /**
     * Registers a @font-face <style> element that was hoisted to document.head by this widget.
     * The element will be removed from document.head when cleanup() is called.
     * onRemove is invoked after removal, allowing the caller to evict deduplication state.
     */
    trackFontStyle(style: HTMLStyleElement, onRemove?: () => void): void {
        style.setAttribute('data-extension-font-id', this.instanceId);
        this.fontStyleElements.push({el: style, onRemove});
    }

    /**
     * Cleans up all resources for this executor instance:
     * removes interceptors, cancels timers, and removes this instance's script tags and
     * hoisted font-face <style> elements from document.head.
     */
    cleanup(): void {
        // Remove interceptors
        this.removeInterceptors();

        // Clear all tracked timeouts
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.timeouts.clear();

        // Clear all tracked intervals
        this.intervals.forEach(id => window.clearInterval(id));
        this.intervals.clear();

        // Remove only this instance's script elements from document.head
        this.scriptElements.forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
        this.scriptElements.length = 0;

        // Remove hoisted @font-face <style> elements and invoke per-entry cleanup callbacks
        this.fontStyleElements.forEach(({el, onRemove}) => {
            el.remove();
            onRemove?.();
        });
        this.fontStyleElements.length = 0;
    }

    /**
     * Removes all extension scripts from document.head.
     * Useful for SPA navigation where all loaded extension content is discarded.
     */
    static removeScripts(): void {
        document.head.querySelectorAll('script[data-extension-script-id]').forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
    }

    /**
     * Removes all hoisted @font-face <style> elements from document.head.
     * Useful for SPA navigation where all loaded extension content is discarded.
     */
    static removeFontStyles(): void {
        document.head.querySelectorAll('style[data-extension-font-id]').forEach(style => style.remove());
    }
}
