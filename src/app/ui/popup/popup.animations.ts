import {animate, style, transition, trigger} from '@angular/animations';

export const popupTransitions = trigger('popupTransitions', [
  transition('* => fadeIn', [
    style({opacity: 0}),
    animate('0.2s linear', style({opacity: 1})),
  ]),
  transition('fadeIn => void', [
    style({opacity: 1}),
    animate('0.2s linear', style({opacity: 0})),
  ]),
  transition('* => fadeInDown', [
    style({opacity: 0, transform: 'translateY(20%)'}),
    animate('0.2s linear', style({opacity: 1, transform: 'translateY(0)'})),
  ]),
  transition('fadeInDown => void', [
    style({opacity: 1, transform: 'translateY(0)'}),
    animate('0.2s linear', style({opacity: 0, transform: 'translateY(20%)'})),
  ]),
]);
