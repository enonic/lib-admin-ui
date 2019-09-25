/**
 * Main file for all admin API classes and methods.
 */
import {StyleHelper} from './StyleHelper';

/*
 Prefix must match @_CLS_PREFIX in web\admin\common\styles\_module.less
 */
StyleHelper.setCurrentPrefix(StyleHelper.ADMIN_PREFIX);

// declare var require: { context: (directory: string, useSubdirectories: boolean, filter: RegExp) => void };
// const importAll = r => r.keys().forEach(r);
// importAll(require.context('./', true, /^(?!\.[\/\\]types).*/));
// importAll(require.context('./', true, /.+\.(ts|js)/));
// importAll(require.context('./app', true, /.+\.(ts|js)/));
export {StyleHelper} from './StyleHelper';
// export {KeyBindings} from './ui/KeyBindings';
export {Element} from './dom/Element';
export {ElementHelper} from './dom/ElementHelper';
export {DivEl} from './dom/DivEl';
