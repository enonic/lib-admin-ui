import {Element} from '../dom/Element';
import * as Q from 'q';
import {DefaultErrorHandler} from '../DefaultErrorHandler';
import {Body} from '../dom/Body';

export interface WidgetElement {
    el: Element
    assets?: HTMLElement[],
}

export class WidgetHelper {
    static createFromHtmlAndAppend(html: string, container?: Element): Q.Promise<WidgetElement> {
        const widgetEl: Element = WidgetHelper.createFromHtml(html);
        const deferred: Q.Deferred<WidgetElement> = Q.defer<WidgetElement>();
        const parentContainer = container || Body.get();
        parentContainer.appendChild(widgetEl);

        WidgetHelper.moveWidgetAssetsToDocumentHead(widgetEl)
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
                addTags: WidgetHelper.getAllowedWidgetTags(allowTags),
                addAttributes: ['target'],  // allow opening links in a new window
            },
        );
    }

    static moveWidgetAssetsToDocumentHead(widgetEl: Element): Q.Promise<HTMLElement[]> {
        const promises: Q.Promise<HTMLElement>[] = [];
        promises.push(...WidgetHelper.doMoveWidgetAssetsToDocumentHead(widgetEl, 'link'));
        promises.push(...WidgetHelper.doMoveWidgetAssetsToDocumentHead(widgetEl, 'script'));
        return Q.all(promises);
    }

    private  static doMoveWidgetAssetsToDocumentHead(widgetEl: Element, tag: string): Q.Promise<HTMLElement>[] {
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

    private static getAllowedWidgetTags(allowTags?: string[]): string[] {
        return [
            'widget',
            'link', // allow widget assets
            'script',
        ].concat(allowTags || []);
    }
}
