import {
  animate,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

import {animationElementQuery} from 'app/util';

export const wordCardTransitions = trigger('wordCardTransitions', [
  transition('void => enter-0', [
    style({opacity: 0, transform: 'translate3d(0, 50%, 0)'}),
    animate(
      '0.4s ease-out',
      style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
    ),
  ]),
  transition('void => enter-1', [
    style({opacity: 0, transform: 'translate3d(0, 60%, 0)'}),
    animate(
      '0.4s 100ms ease-out',
      style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
    ),
  ]),
  transition('void => enter-2', [
    style({opacity: 0, transform: 'translate3d(0, 70%, 0)'}),
    animate(
      '0.4s 200ms ease-out',
      style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
    ),
  ]),
  transition('void => enter-3', [
    style({opacity: 0, transform: 'translate3d(0, 80%, 0)'}),
    animate(
      '0.4s 300ms ease-out',
      style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
    ),
  ]),
  transition('void => default', [
    style({opacity: 0, transform: 'scale(0.85)'}),
    animate(
      '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      style({opacity: 1, transform: 'scale(1)'}),
    ),
  ]),
]);

export const notificationCardTransitions = trigger(
  'notificationCardTransitions',
  [
    transition('void => *', [style({opacity: 0})]),
    transition('void => true', [
      style({opacity: 0}),
      animate('0.4s ease-out', style({opacity: 1})),
    ]),
    transition('* => void', [
      style({opacity: 1}),
      animate('0.2s ease-out', style({opacity: 0})),
    ]),
  ],
);
