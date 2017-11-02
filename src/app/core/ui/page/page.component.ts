import {
  AnimationMetadata,
  AnimationQueryOptions,
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {Component, ElementRef, OnInit} from '@angular/core';
import * as $ from 'jquery';

const q = (
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) => query(selector, animation, options);

export const pageTransitions = [
  transition(':enter', [
    q('.page-header', style({transform: 'translateY(-100%)'})),
    q('.page-header > .inner', style({transform: 'translateY(-100%)'})),
    q('.page-content', style({opacity: '0'})),
    q('.page-footer', style({transform: 'translateY(100%)'})),
    group(
      [
        q('.page-header', animate('0.2s ease-out', style({transform: 'translateY(0)'}))),
        q('.page-header > .inner', animate('0.2s ease-out', style({transform: 'translateY(0)'})), {
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
      q('.page-header > .inner', animate('0.2s ease-out', style({transform: 'translateY(-100%)'}))),
      q('.page-header', animate('0.2s ease-out', style({transform: 'translateY(-100%)'})), {
        delay: 200,
      }),
      q('.page-content', animate('0.2s linear', style({opacity: '0'}))),
      q('.page-footer', animate('0.2s ease-out', style({transform: 'translateY(100%)'}))),
    ]),
  ]),
];

const headerExtendTransitions = trigger('headerExtendTransitions', [
  transition(':enter', [style({height: 0}), animate('0.2s ease-out', style({height: '*'}))]),
  transition(':leave', animate('0.2s ease-out', style({height: 0}))),
]);

@Component({
  selector: 'wb-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.less'],
  animations: [headerExtendTransitions],
})
export class PageComponent implements OnInit {
  expandedHeaderExtend = false;

  element: HTMLElement;

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;
  }

  toggleHeaderExtend(force?: boolean): void {
    if (force !== undefined) {
      this.expandedHeaderExtend = force;
    } else {
      this.expandedHeaderExtend = !this.expandedHeaderExtend;
    }
  }

  ngOnInit(): void {
    $(this.element).on('click', event => {
      let $target = $(event.target);
      if ($target.closest('[page-header-extend-trigger]').length) {
        this.toggleHeaderExtend();
      } else if (this.expandedHeaderExtend) {
        if ($target.closest('[routerlink]').length) {
          return;
        }

        this.toggleHeaderExtend(false);
      }
    });
  }
}
