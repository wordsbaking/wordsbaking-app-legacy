import {animate, style, transition, trigger} from '@angular/animations';

export const loadingTransitions = trigger('loadingTransitions', [
  transition(':enter', [
    style({opacity: 0}),
    animate('0.2s linear', style({opacity: 1})),
  ]),
  transition(':leave', [animate('0.2s linear', style({opacity: 0}))]),
]);
