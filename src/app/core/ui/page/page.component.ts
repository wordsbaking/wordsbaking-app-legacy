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

export const pageTransitions = [
  transition(':enter', [
    q('.page-header', style({height: '0'})),
    q('.page-header .inner', style({transform: 'translateY(-100%)'})),
    q('.page-content', style({opacity: '0'})),
    q('.page-footer', style({transform: 'translateY(100%)'})),
    group(
      [
        q('.page-header', animate('0.2s ease-out', style({height: '*'}))),
        q('.page-header .inner', animate('0.2s ease-out', style({transform: 'translateY(0)'})), {
          delay: 200,
        }),
        q('.page-content', animate('0.2s linear', style({opacity: '1'})), {delay: 200}),
        q('.page-footer', animate('0.2s ease-out', style({transform: 'translateY(0)'})), {
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
      q('.page-header .inner', animate('0.2s ease-out', style({transform: 'translateY(-100%)'}))),
      q('.page-header', animate('0.2s ease-out', style({height: '0'})), {delay: 200}),
      q('.page-content', animate('0.2s linear', style({opacity: '0'}))),
      q('.page-footer', animate('0.2s ease-out', style({transform: 'translateY(100%)'}))),
    ]),
  ]),
];

@Component({
  selector: 'wb-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.less'],
  animations: [],
})
export class PageComponent {}
