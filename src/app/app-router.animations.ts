import {
  animateChild,
  sequence,
  style,
  transition,
  trigger,
} from '@angular/animations';

import {animationElementQuery} from 'app/util';

export const routerTransitions = trigger('routerTransitions', [
  transition('* <=> *', [
    animationElementQuery(
      'wb-view:enter',
      style({
        position: 'fixed',
        right: 0,
        bottom: 0,
        top: 0,
        left: 0,
        zIndex: 0,
      }),
    ),
    animationElementQuery(
      'wb-view:leave',
      style({
        position: 'fixed',
        right: 0,
        bottom: 0,
        top: 0,
        left: 0,
        zIndex: 1,
      }),
    ),
    sequence([
      animationElementQuery('wb-view:leave', animateChild()),
      animationElementQuery('wb-view:enter', animateChild()),
    ]),
  ]),
]);
