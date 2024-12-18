import {AiTool, AiToolConfig} from './AiTool';
import {AiAnimationHandler, AnimationEffect, RGBColor} from './ui/AiAnimationHandler';
import {AiToolType} from './AiToolType';

export class AiAnimationTool extends AiTool {

    constructor(config: AiToolConfig) {
        super(AiToolType.ANIMATE, config);
    }

    animate(animationEffects: AnimationEffect | AnimationEffect[], color?: RGBColor): void {
        const effects = Array.isArray(animationEffects) ? animationEffects : [animationEffects];

        effects.forEach((effect: AnimationEffect) => {
           if (effect === 'glow') {
               AiAnimationHandler.glow(this.config.pathElement, color);
           } else if (effect === 'innerGlow') {
               AiAnimationHandler.innerGlow(this.config.pathElement, color);
           } else if (effect === 'scroll') {
               AiAnimationHandler.scroll(this.config.pathElement);
           }
        });
    }
}
