import {animate, style, transition, trigger} from '@angular/animations';

export const wordCardTransitions = trigger('wordCardTransitions', [
  transition('void => true', [
    style({opacity: 0, transform: 'scale(0.8)'}),
    animate(
      '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      style({opacity: 1, transform: 'scale(1)'}),
    ),
  ]),
]);
