import {
  AnimationMetadata,
  AnimationQueryOptions,
  animate,
  group,
  query,
  style,
  transition,
} from '@angular/animations';
import {Component} from '@angular/core';

const q = (
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) => query(selector, animation, options);

export const frameTransitions = [
  transition(':enter', [
    q('.frame-header', style({height: '0'})),
    q('.frame-header .inner', style({transform: 'translateY(-100%)'})),
    q('.frame-content', style({opacity: '0'})),
    q('.frame-footer', style({transform: 'translateY(100%)'})),
    group(
      [
        q('.frame-header', animate('0.2s ease-out', style({height: '*'}))),
        q('.frame-header .inner', animate('0.2s ease-out', style({transform: 'translateY(0)'})), {
          delay: 200,
        }),
        q('.frame-content', animate('0.2s linear', style({opacity: '1'})), {delay: 200}),
        q('.frame-footer', animate('0.2s ease-out', style({transform: 'translateY(0)'})), {
          delay: 200,
        }),
      ],
      {
        delay: 200,
      },
    ),
  ]),
  transition(':leave', [
    group([
      q('.frame-header .inner', animate('0.2s ease-out', style({transform: 'translateY(-100%)'}))),
      q('.frame-header', animate('0.2s ease-out', style({height: '0'})), {delay: 200}),
      q('.frame-content', animate('0.2s linear', style({opacity: '0'}))),
      q('.frame-footer', animate('0.2s ease-out', style({transform: 'translateY(100%)'}))),
    ]),
  ]),
];

@Component({
  selector: 'wb-frame',
  templateUrl: './frame.component.html',
  styleUrls: ['./frame.component.less'],
  animations: [],
})
export class FrameComponent {}
