import {animate, group, style, transition, trigger} from '@angular/animations';

import {animationElementQuery} from 'app/util';

export const splashScreenTransitions = trigger('splashScreenTransitions', [
  transition('enable => void', [
    group([
      animationElementQuery(
        '.screen',
        animate(
          '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({opacity: 0, transform: 'scale(0.98)'}),
        ),
      ),
      animate('0.2s 200ms linear', style({opacity: 0})),
    ]),
  ]),
]);
