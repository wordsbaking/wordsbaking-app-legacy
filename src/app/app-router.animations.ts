import {
  animateChild,
  sequence,
  style,
  transition,
  trigger,
} from '@angular/animations';

import {AnimationTool} from 'app/util';

export const routerTransitions = trigger('routerTransitions', [
  transition('* <=> *', [
    AnimationTool.query(
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
    AnimationTool.query(
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
      AnimationTool.query('wb-view:leave', animateChild()),
      AnimationTool.query('wb-view:enter', animateChild()),
    ]),
  ]),
]);
