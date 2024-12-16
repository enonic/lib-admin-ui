import {AiHelperState} from '../AiHelperState';
import {AiTool} from './AiTool';
import {AnimationEffect, RGBColor} from './ui/AiAnimationHandler';
import {AiDialogIconTool} from './AiDialogIconTool';
import {AiAnimationTool} from './AiAnimationTool';
import {AiToolsRegistry} from '../AiToolsRegistry';
import {AiToolType} from './AiToolType';
import {AiStateTool} from './AiStateTool';

export class AiToolHelper {

    private static INSTANCE: AiToolHelper;

    protected constructor() {
        //
    }

    static get(): AiToolHelper {
        if (!AiToolHelper.INSTANCE) {
            AiToolHelper.INSTANCE = new AiToolHelper();
        }

        return this.INSTANCE;
    }

    setActiveContext(context: string): void {
        this.getTools().forEach((tool: AiTool) => {
           if (tool.getType() === AiToolType.DIALOG) {
               (tool as AiDialogIconTool).setActiveContext(context);
           }
        });
    }

    setState(path: string, state: AiHelperState, data?: {text: string}): void {
        this.getHelpers(path, AiToolType.STATE).forEach((tool: AiStateTool) => {
            tool.setState(state, data);
        });
    }

    animate(path: string, animationEffects: AnimationEffect | AnimationEffect[], color?: RGBColor): void {
        this.getHelpers(path, AiToolType.ANIMATE).forEach((tool: AiAnimationTool) => {
            tool.animate(animationEffects, color);
        });
    }

    private getTools(): Set<AiTool> {
        return AiToolsRegistry.get().getTools();
    }

    private getHelpers(fullPath: string, type?: AiToolType): AiTool[] {
        const result: AiTool[] = [];
        const [group, path] = this.divideToGroupAndPath(fullPath);

        this.getTools().forEach((tool: AiTool) => {
            if ((!type || type === tool.getType()) && (!group || tool.getGroup() === group) && tool.getDataPath() === path) {
                result.push(tool);
            }
        });

        return result;
    }

    private divideToGroupAndPath(fullPath: string): [string | undefined, string] {
        if (fullPath.startsWith('__')) {
            const pathParts = fullPath.split('/');
            return [pathParts[0], '/' + pathParts.slice(1).join('/')];
        }

        return [undefined, fullPath];
    }

}
