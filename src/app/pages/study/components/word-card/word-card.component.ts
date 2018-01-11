import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

import {Easing, animate} from 'app/lib/animate';

import {SettingsConfigService} from 'app/core/config';
import {TTSService} from 'app/platform/common';

import {
  CompleteCallback,
  ProgressCallback,
  WORD_CARD_WIDTH,
  WordCardComponentBase,
} from '../common/word-card-component-base';

const SLIDE_Y_TRIGGER_SHOW_DETAIL_OFFSET = 200;

@Component({
  selector: 'wb-study-view-word-card',
  templateUrl: './word-card.component.html',
  styleUrls: ['./word-card.component.less'],
})
export class WordCardComponent extends WordCardComponentBase
  implements AfterViewInit {
  @Input('data') word: WordInfo;
  @Output('active') activeEvent = new EventEmitter<void>();
  @Output('removing') removingEvent = new EventEmitter<void>();

  protected briefElement: HTMLElement;
  protected briefElementStyle: CSSStyleDeclaration;
  protected labelInnerWrapperElement: HTMLElement;
  protected labelInnerWrapperElementStyle: CSSStyleDeclaration;

  constructor(
    ref: ElementRef,
    ttsService: TTSService,
    settingsConfigService: SettingsConfigService,
  ) {
    super(ttsService, settingsConfigService);
    this.element = ref.nativeElement;
  }

  async remove(): Promise<void> {
    let {innerElement} = this;

    if (this.removed) {
      return;
    }

    this.animating = true;
    this.removed = true;

    try {
      await animate(0, 1, 200, Easing.circular, percentage => {
        innerElement.style.transform = `translate3d(-${percentage *
          WORD_CARD_WIDTH}px, 0, 0)`;
        innerElement.style.opacity = (1 - percentage) as any;
      });
    } catch (e) {
      this.removed = false;
    }

    this.animating = false;
  }

  ngAfterViewInit(): void {
    this.onViewInit();

    let {element} = this;

    this.briefElement = element.querySelector('.brief') as HTMLElement;
    this.briefElementStyle = this.briefElement.style;
    this.labelInnerWrapperElement = element.querySelector(
      '.label-inner-wrapper',
    ) as HTMLElement;
    this.labelInnerWrapperElementStyle = this.labelInnerWrapperElement.style;
    this.audioPlayButtonElement = element.querySelector(
      '.head .icon.audio',
    ) as HTMLElement;
    this.audioPlayButtonElementStyle = this.audioPlayButtonElement.style;
  }

  onSlideX(
    diffX: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let {labelInnerWrapperElementStyle} = this;
    super.onSlideX(diffX, startTime, isEnd, progress, complete);

    labelInnerWrapperElementStyle.transform = `translate3d(0, 0, 0)`;

    if (isEnd) {
      this.reset();
    }
  }

  onSlideY(
    diffY: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    super.onSlideY(diffY, startTime, isEnd, progress, complete);

    this.respondSideYToDown(
      Math.max(diffY, 0),
      startTime,
      isEnd,
      progress,
      complete,
    );

    if (isEnd) {
      this.reset();
    }
  }

  private respondSideYToDown(
    offset: number,
    _startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let {
      briefElement,
      briefElementStyle,
      audioPlayButtonElementStyle,
      labelInnerWrapperElementStyle,
    } = this;

    let scrollHeight = briefElement.scrollHeight;
    let percentage = Math.min(offset / scrollHeight, 1);
    let height = Math.min(offset, scrollHeight);
    let statsSet = new Set<string>();

    briefElementStyle.height = `${Math.min(scrollHeight, height)}px`;

    if (percentage > 0.5) {
      let briefOpacity = Math.min(percentage - 0.5, 0.32) / 0.32;
      briefElementStyle.opacity = briefOpacity as any;
      statsSet.add('viewed-briefs');
    } else {
      briefElementStyle.opacity = 0 as any;
    }

    if (percentage > 0.1) {
      let audioIconOpacity = 1 - Math.min(percentage - 0.1, 0.3) / 0.3;
      audioPlayButtonElementStyle.opacity = audioIconOpacity as any;
      statsSet.add('hide-audio-play-button');
    } else {
      audioPlayButtonElementStyle.opacity = 1 as any;
    }

    let labelInnerWrapperOffset =
      Math.min(
        Math.max(offset - scrollHeight, 0) / SLIDE_Y_TRIGGER_SHOW_DETAIL_OFFSET,
        1,
      ) * -50;

    if (labelInnerWrapperOffset <= -25 || this.obstinate) {
      labelInnerWrapperOffset = -50;
    } else {
      labelInnerWrapperOffset = 0;
    }

    labelInnerWrapperElementStyle.transform = `translate3d(0, ${labelInnerWrapperOffset}%, 0)`;

    if (labelInnerWrapperOffset === -50) {
      statsSet.add('show-detail-plus');
    }

    let isComplete = isEnd && labelInnerWrapperOffset === -50;

    if (isComplete) {
      statsSet.add('complete');
    }

    if (progress) {
      progress(percentage, statsSet);
    }

    if (isComplete && complete) {
      complete();
    }
  }

  private reset(): void {
    let {briefElementStyle, audioPlayButtonElementStyle} = this;

    briefElementStyle.opacity = 0 as any;
    briefElementStyle.height = '0px';
    audioPlayButtonElementStyle.opacity = 1 as any;
  }
}
