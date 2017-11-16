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
  EventEmitter,
  HostBinding,
  Input,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

import {
  CompleteCallback,
  ProgressCallback,
  WordCardComponentBase,
} from '../common/word-card-component-base';

export function q(
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions = {optional: true},
) {
  return query(selector, animation, options);
}

@Component({
  selector: 'wb-study-view-word-detail-card',
  templateUrl: './word-detail-card.component.html',
  styleUrls: ['./word-detail-card.component.less'],
  animations: [
    trigger('wordDetailCardTransitions', [
      transition(':enter', [
        style({backgroundColor: 'rgba(238, 238, 238, 0)'}),
        q('.word-detail-card', style({opacity: 0, transform: 'scale(0.95)'})),
        group([
          animate(
            '0.2s linear',
            style({backgroundColor: 'rgba(238, 238, 238, 0.9)'}),
          ),
          q(
            '.word-detail-card',
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
        q('.word-detail-card', style({opacity: 1, transform: 'scale(1)'})),
        group([
          q(
            '.word-detail-card',
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
export class WordDetailCardComponent extends WordCardComponentBase
  implements AfterViewInit {
  @Input('data') word: WordInfo;
  @Input('active') activeEvent = new EventEmitter<void>();
  @Input('removing') removingEvent = new EventEmitter<void>();

  @HostBinding('@wordDetailCardTransitions') wordDetailCardTransitions = '';

  constructor(ref: ElementRef) {
    super();

    this.element = ref.nativeElement;
  }

  ngAfterViewInit(): void {
    this.onViewInit();
  }

  onSlideX(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    super.onSlideX(offset, startTime, isEnd, progress, complete);
    // ..
  }
}
