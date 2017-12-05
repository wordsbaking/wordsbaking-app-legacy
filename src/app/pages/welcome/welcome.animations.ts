import {animate, group, style, transition, trigger} from '@angular/animations';

import {animationElementQuery} from 'app/util';

export const welcomeTransitions = trigger('welcomeTransitions', [
  transition(':enter', [
    animationElementQuery(
      '.title',
      style({
        transform: 'translate3d(-50%, 0, 0) scale(0.94)',
        opacity: 0,
      }),
    ),
    animationElementQuery(
      '.slide-line',
      style({
        opacity: 0,
      }),
    ),
    group([
      animationElementQuery(
        '.title',
        animate(
          '0.6s 400ms linear',
          style({
            transform: 'translate3d(-50%, 0, 0) scale(1)',
            opacity: 1,
          }),
        ),
      ),
      animationElementQuery(
        '.slide-line',
        animate(
          '0.6s 1000ms linear',
          style({
            opacity: 1,
          }),
        ),
      ),
    ]),
  ]),
]);
