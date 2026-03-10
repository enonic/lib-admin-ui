import Q from 'q';
import {DefaultErrorHandler} from '../DefaultErrorHandler';
import {Body} from '../dom/Body';
import {Element} from '../dom/Element';

export interface ExtensionElement {
    el: Element
    assets?: HTMLElement[],
}

export class ExtensionHelper {
    static createFromHtmlAndAppend(html: string, container?: Element): Q.Promise<ExtensionElement> {
        const widgetEl: Element = ExtensionHelper.createFromHtml(html);
        const deferred: Q.Deferred<ExtensionElement> = Q.defer<ExtensionElement>();
        const parentContainer = container || Body.get();
        parentContainer.appendChild(widgetEl);

        ExtensionHelper.moveAssetsToDocumentHead(widgetEl)
            .then((assets: HTMLElement[]) => deferred.resolve({
                el: widgetEl,
                assets
            }))
            .catch(DefaultErrorHandler.handle);

        return deferred.promise;
    }

    static createFromHtml(html: string, allowTags?: string[]): Element {
        const widgetRegexResult: RegExpMatchArray = html.match(/<widget(\s.*?)?>[\s\S]*?<\/widget>/g);

        if (!widgetRegexResult) {
            throw Error('Widget contents must be wrapped inside <widget></widget> tags');
        }

        return Element.fromCustomarilySanitizedString(
            widgetRegexResult[0],
            true,
            {
                addTags: ExtensionHelper.getAllowedTags(allowTags),
                addAttributes: ['target'],  // allow opening links in a new window
            },
        );
    }

    static moveAssetsToDocumentHead(widgetEl: Element): Q.Promise<HTMLElement[]> {
        const promises: Q.Promise<HTMLElement>[] = [];
        promises.push(...ExtensionHelper.doMoveAssetsToDocumentHead(widgetEl, 'link'));
        promises.push(...ExtensionHelper.doMoveAssetsToDocumentHead(widgetEl, 'script'));
        return Q.all(promises);
    }

    private static doMoveAssetsToDocumentHead(widgetEl: Element, tag: string): Q.Promise<HTMLElement>[] {
        const elements = widgetEl.getHTMLElement().getElementsByTagName(tag);
        const elementsToRemove = [];
        const promises: Q.Promise<HTMLElement>[] = [];

        for (let i = 0; i < elements.length; i++) {
            const el = elements.item(i);
            elementsToRemove.push(el);

            const newElement: HTMLElement = document.createElement(tag);

            el.getAttributeNames().forEach((attr: string) => {
                newElement.setAttribute(attr, el.getAttribute(attr));
            });

            const isInlineScript = (tag === 'script' && el.getAttribute('type') === 'application/json');
            if (isInlineScript) {
                newElement.innerHTML = (el as HTMLScriptElement).innerHTML;
                promises.push(Q.resolve(newElement));
            } else {
                const deferred: Q.Deferred<HTMLElement> = Q.defer<HTMLElement>();
                promises.push(deferred.promise);

                newElement.onload = () => deferred.resolve(newElement);
                newElement.onerror = () => deferred.resolve(newElement);
            }


            document.head.appendChild(newElement);
            widgetEl.onRemoved(() => newElement.remove());
        }

        elementsToRemove.forEach((el: Element) => el.remove());

        return promises;
    }

    private static getAllowedTags(allowTags?: string[]): string[] {
        return [
            'widget',
            'link', // allow widget assets
            'script',
        ].concat(allowTags || []);
    }
}
