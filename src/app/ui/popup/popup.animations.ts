import {animate, style, transition, trigger} from '@angular/animations';

export const popupTransitions = trigger('popupTransitions', [
  transition('* => fadeIn', [
    style({opacity: 0}),
    animate('0.2s linear', style({opacity: 1})),
  ]),
  transition('fadeIn => void', [
    style({opacity: 1}),
    animate('0.1s linear', style({opacity: 0})),
  ]),
  transition('* => fadeInDown', [
    style({opacity: 0, transform: 'translateY(20%)'}),
    animate('0.2s ease-out', style({opacity: 1, transform: 'translateY(0)'})),
  ]),
  transition('fadeInDown => void', [
    style({opacity: 1, transform: 'translateY(0)'}),
    animate('0.2s ease-out', style({opacity: 0, transform: 'translateY(80%)'})),
  ]),
  transition('* => bounceInUp', [
    style({opacity: 0, transform: 'translateY(60%)'}),
    animate(
      '0.4s cubic-bezier(0.176, 0.885, 0.32, 1.275)',
      style({opacity: 1, transform: 'translateY(0)'}),
    ),
  ]),
  transition('bounceInUp => void', [
    style({opacity: 1}),
    animate('0.2s ease-out', style({opacity: 0})),
  ]),
]);
