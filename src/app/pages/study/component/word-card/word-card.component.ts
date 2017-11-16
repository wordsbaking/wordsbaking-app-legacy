import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

import {
  CompleteCallback,
  ProgressCallback,
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

  constructor(ref: ElementRef) {
    super();
    this.element = ref.nativeElement;
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
    this.audioIconElement = element.querySelector(
      '.head .icon.audio',
    ) as HTMLElement;
    this.audioIconElementStyle = this.audioIconElement.style;
  }

  onSlideX(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let {labelInnerWrapperElementStyle} = this;
    super.onSlideX(offset, startTime, isEnd, progress, complete);

    labelInnerWrapperElementStyle.transform = `translateY(0%)`;

    if (isEnd) {
      this.reset();
    }
  }

  onSlideY(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    this.respondSideYToDown(
      Math.max(offset, 0),
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
    y: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let {
      briefElement,
      briefElementStyle,
      audioIconElementStyle,
      labelInnerWrapperElementStyle,
    } = this;

    let scrollHeight = briefElement.scrollHeight;
    let percentage = Math.min(y / scrollHeight, 1);
    let height = Math.min(y, scrollHeight);

    briefElementStyle.height = `${Math.min(scrollHeight, height)}px`;

    if (percentage > 0.5) {
      let briefOpacity = Math.min(percentage - 0.5, 0.32) / 0.32;
      briefElementStyle.opacity = briefOpacity as any;
    } else {
      briefElementStyle.opacity = 0 as any;
    }

    if (percentage > 0.1) {
      let audioIconOpacity = 1 - Math.min(percentage - 0.1, 0.3) / 0.3;
      audioIconElementStyle.opacity = audioIconOpacity as any;
    } else {
      audioIconElementStyle.opacity = 1 as any;
    }

    let labelInnerWrapperOffset =
      Math.min(
        Math.max(y - scrollHeight, 0) / SLIDE_Y_TRIGGER_SHOW_DETAIL_OFFSET,
        1,
      ) * -50;

    if (labelInnerWrapperOffset <= -25) {
      labelInnerWrapperOffset = -50;
    }

    labelInnerWrapperElementStyle.transform = `translateY(${labelInnerWrapperOffset}%)`;

    if (progress) {
      progress(percentage);
    }

    if (isEnd) {
      if (labelInnerWrapperOffset <= -25 && complete) {
        complete();
      }
    }
  }

  private reset(): void {
    let {briefElementStyle, audioIconElementStyle} = this;

    briefElementStyle.opacity = 0 as any;
    briefElementStyle.height = '0px';
    audioIconElementStyle.opacity = 1 as any;
  }
}
