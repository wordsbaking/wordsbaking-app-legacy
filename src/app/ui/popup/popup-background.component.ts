import {animate, style, transition, trigger} from '@angular/animations';
import {Component, HostBinding, Input} from '@angular/core';

const backgroundTransitions = trigger('backgroundTransitions', [
  transition(':enter', [
    style({opacity: 0}),
    animate('0.2s linear', style({opacity: 1})),
  ]),
  transition(':leave', [
    style({opacity: 1}),
    animate('0.2s 140ms ease-out', style({opacity: 0})),
  ]),
]);

@Component({
  selector: 'wb-popup-background',
  template: '',
  styleUrls: ['./popup-background.component.less'],
  animations: [backgroundTransitions],
})
export class PopupBackgroundComponent {
  @Input()
  set background(color: string) {
    this.backgroundColor = color;
  }

  get background(): string {
    return this.backgroundColor;
  }

  @HostBinding('@backgroundTransitions') state = '';

  @HostBinding('style.backgroundColor')
  private backgroundColor = 'rgba(0, 0, 0, 0.4)';
}
