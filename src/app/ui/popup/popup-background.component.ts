import {animate, style, transition, trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

const backgroundTransitions = trigger('backgroundTransitions', [
  transition(':enter', [
    style({opacity: 0}),
    animate('0.2s linear', style({opacity: 1})),
  ]),
  transition(':leave', [
    style({opacity: 1}),
    animate('0.2s ease-out', style({opacity: 0})),
  ]),
]);

@Component({
  selector: 'wb-popup-background',
  template: '',
  styleUrls: ['./popup-background.component.less'],
  animations: [backgroundTransitions],
})
export class PopupBackgroundComponent {
  @HostBinding('@backgroundTransitions') state = '';
}
