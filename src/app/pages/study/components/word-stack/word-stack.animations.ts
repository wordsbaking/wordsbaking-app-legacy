import {animate, style, transition, trigger} from '@angular/animations';

export const wordCardTransitions = trigger('wordCardTransitions', [
  transition('void => true', [
    style({opacity: 0, transform: 'translate3d(0, 20%, 0)'}),
    animate(
      '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
    ),
  ]),
]);

export const notificationCardTransitions = trigger(
  'notificationCardTransitions',
  [
    transition('void => true', [
      style({opacity: 0, transform: 'translate3d(0, 15%, 0)'}),
      animate(
        '0.4s ease-out',
        style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
      ),
    ]),
    transition('* => void', [
      style({opacity: 1}),
      animate('0.2s ease-out', style({opacity: 0})),
    ]),
  ],
);
