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

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

import {WordCardBase} from '../common/word-card-base';

export function q(
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) {
  return query(selector, animation, options);
}

@Component({
  selector: 'wb-study-view-word-card-detail',
  templateUrl: './word-card-detail.component.html',
  styleUrls: ['./word-card-detail.component.less'],
  animations: [
    trigger('wordCardDetailTransitions', [
      transition(':enter', [
        style({backgroundColor: 'rgba(238, 238, 238, 0)'}),
        q('.word-card-detail', style({opacity: 0, transform: 'scale(0.95)'})),
        group([
          animate(
            '0.2s linear',
            style({backgroundColor: 'rgba(238, 238, 238, 0.9)'}),
          ),
          q(
            '.word-card-detail',
            animate(
              '0.2s 100ms ease-out',
              style({
                opacity: 1,
                transform: 'scale(1)',
              }),
            ),
          ),
        ]),
      ]),
      transition(':leave', [
        style({backgroundColor: 'rgba(238, 238, 238, 0.9)'}),
        q('.word-card-detail', style({opacity: 1, transform: 'scale(1)'})),
        group([
          q(
            '.word-card-detail',
            animate(
              '0.2s ease-out',
              style({
                opacity: 0,
                transform: 'scale(0.9)',
              }),
            ),
          ),
          animate(
            '0.2s 100ms linear',
            style({backgroundColor: 'rgba(238, 238, 238, 0)'}),
          ),
        ]),
      ]),
    ]),
  ],
})
export class WordCardDetailComponent extends WordCardBase
  implements AfterViewInit {
  @Input('data') word: WordInfo;

  @HostBinding('@wordCardDetailTransitions') wordCardDetailTransitions = '';

  constructor(ref: ElementRef) {
    super();

    this.element = ref.nativeElement;
  }

  ngAfterViewInit(): void {
    this.viewInit();
  }
}
