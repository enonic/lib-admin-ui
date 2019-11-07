import {SpanEl} from '../../dom/SpanEl';
import {StringHelper} from '../../util/StringHelper';
import {DivEl} from '../../dom/DivEl';
import {H2El} from '../../dom/H2El';
import {UlEl} from '../../dom/UlEl';
import {Element} from '../../dom/Element';
import {LiEl} from '../../dom/LiEl';

export class ItemDataGroup
    extends DivEl {

    private header: H2El;

    private dataLists: UlEl[] = [];

    constructor(title: string, className?: string) {
        super(!!className ? className + ' item-data-group' : 'item-data-group');
        this.header = new H2El();
        this.header.getEl().setInnerHtml(title);
        this.appendChild(this.header);
    }

    clearList() {
        this.dataLists.forEach(this.removeChild.bind(this));
        this.dataLists.length = 0;
    }

    addDataList(header: string, ...datas: string[]): UlEl {
        return this.addDataArray(header, datas);
    }

    addDataArray(header: string, datas: string[]): UlEl {
        const elements = datas.filter(text => !StringHelper.isBlank(text)).map(text => new SpanEl().setHtml(text, false));
        return this.addDataElements(header, elements);
    }

    addDataElements(header: string, datas: Element[]): UlEl {
        let dataList = new UlEl('data-list');

        if (!datas || datas.length === 0) {
            return null;
        }

        if (header) {
            this.addHeader(header, dataList);
        }

        datas.forEach((data) => {
            const dataElement = new LiEl();
            dataElement.appendChild(data);
            dataList.appendChild(dataElement);
        });
        this.dataLists.push(dataList);
        this.appendChild(dataList);
        return dataList;
    }

    getHeader(): H2El {
        return this.header;
    }

    isEmpty(): boolean {
        return this.dataLists.length === 0;
    }

    private addHeader(header: string, dataList: UlEl) {
        let headerElement = new LiEl();
        headerElement.addClass('list-header');

        headerElement.getEl().setInnerHtml(header, false);
        dataList.appendChild(headerElement);
    }
}
