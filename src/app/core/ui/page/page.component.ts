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

import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, ElementRef} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

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
        q(
          '.page-header',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
        ),
        q(
          '.page-header > .inner',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
          {
            delay: 200,
          },
        ),
        q('.page-content', animate('0.2s linear', style({opacity: '1'})), {
          delay: 200,
        }),
        q(
          '.page-footer',
          animate('0.2s ease-out', style({transform: 'translateY(0)'})),
          {
            delay: 200,
          },
        ),
        style({opacity: 1}),
      ],
      {
        delay: 200,
      },
    ),
  ]),
  transition(':leave', [
    group([
      q(
        '.page-header > .inner',
        animate('0.2s ease-out', style({transform: 'translateY(-100%)'})),
      ),
      q(
        '.page-header',
        animate('0.2s ease-out', style({transform: 'translateY(-100%)'})),
        {
          delay: 200,
        },
      ),
      q('.page-content', animate('0.2s linear', style({opacity: '0'}))),
      q(
        '.page-footer',
        animate('0.2s ease-out', style({transform: 'translateY(100%)'})),
      ),
    ]),
  ]),
];

const headerExtensionTransitions = trigger('headerExtensionTransitions', [
  transition(':enter', [
    style({height: 0}),
    animate('0.2s ease-out', style({height: '*'})),
  ]),
  transition(':leave', animate('0.2s ease-out', style({height: 0}))),
]);

@Component({
  selector: 'wb-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.less'],
  animations: [headerExtensionTransitions],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent {
  headerExtensionExpanded$ = new BehaviorSubject<boolean>(false);

  element: HTMLElement;

  constructor(ref: ElementRef, private location: Location) {
    this.element = ref.nativeElement;
  }

  toggleHeaderExtension(force?: boolean): void {
    if (force !== undefined) {
      this.headerExtensionExpanded$.next(force);
    } else {
      this.headerExtensionExpanded$.next(!this.headerExtensionExpanded$.value);
    }
  }

  back(): void {
    this.location.back();
  }
}
