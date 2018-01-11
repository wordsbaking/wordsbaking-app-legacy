import {animate, style, transition, trigger} from '@angular/animations';

export const snackbarTransitions = trigger('snackbarTransitions', [
  transition(':enter', [
    style({opacity: 0, transform: 'translate3d(0, 100%, 0)'}),
    animate(
      '0.2s ease-out',
      style({opacity: 1, transform: 'translateEd(0, 0, 0)'}),
    ),
  ]),
  transition(':leave', [
    style({opacity: 1, transform: 'translate3d(0, 0, 0)'}),
    animate(
      '0.2s linear',
      style({opacity: 0, transform: 'translate3d(0, 100%, 0)'}),
    ),
  ]),
]);
