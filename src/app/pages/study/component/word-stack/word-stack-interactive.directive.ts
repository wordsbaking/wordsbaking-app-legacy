import {Directive, Host, HostListener, OnDestroy} from '@angular/core';

import * as $ from 'jquery';

import {
  PolylineDelegateEvent,
  SlideXDelegateEvent,
  TapDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
  TouchStartDelegateEvent,
} from 'app/lib/touch-delegate';

import {WordCardComponentBase} from '../common/word-card-component-base';
import {WordCardComponent} from '../word-card/word-card.component';
import {WordDetailCardComponent} from '../word-detail-card/word-detail-card.component';
import {WordStackComponent} from './word-stack.component';

const SLIDE_Y_CHANGE_TO_SLIDE_X_OFFSET = 30;

@Directive({
  selector: '[wbStudyViewWordStackInteractiveHost]',
})
export class WordStackInteractiveDirective implements OnDestroy {
  private touchDelegate: TouchDelegate;
  private targetWordCardComponent: WordCardComponentBase | undefined;
  private locked = false;
  private sliding = false;
  private slideXStartTime = 0;
  private slideYStartTime = 0;

  constructor(@Host() public wordStack: WordStackComponent) {
    this.touchDelegate = new TouchDelegate(wordStack.element, true);
    this.touchDelegate.bind(TouchIdentifier.touchStart);
    this.touchDelegate.bind(TouchIdentifier.touchEnd);
    this.touchDelegate.bind(TouchIdentifier.slideX);
    this.touchDelegate.bind(TouchIdentifier.polylineAfterSlideY);
    this.touchDelegate.bind(TouchIdentifier.tap);
  }

  @HostListener('td-tap', ['$event'])
  onTap(event: TapDelegateEvent): void {
    let {wordStack} = this;

    let $targetElement = $(event.detail.target);
    let $wordCardElement = $targetElement.closest(
      'wb-study-view-word-detail-card, wb-study-view-word-card',
    );

    if (!$wordCardElement.length) {
      wordStack.hideWordDetail();
      return;
    }

    switch ($wordCardElement[0].nodeName.toLowerCase()) {
      case 'wb-study-view-word-detail-card':
        wordStack.hideWordDetail();
        break;

      case 'wb-study-view-word-card': {
        let targetWordCardComponent = wordStack.getWordCardComponentByElement(
          $wordCardElement[0],
        );

        if (!targetWordCardComponent) {
          return;
        }

        wordStack.showWordDetail(targetWordCardComponent.word);
        break;
      }
    }
  }

  @HostListener('td-touch-start', ['$event'])
  onTouchStart(event: TouchStartDelegateEvent): void {
    let {wordStack} = this;

    if (!wordStack.enabledWordCardTransitions) {
      wordStack.enabledWordCardTransitions = true;
    }

    if (this.locked) {
      return;
    }

    let $target = $(event.detail.target);
    let $wordCardElement = $target.closest(
      'wb-study-view-word-card, wb-study-view-word-detail-card',
    );

    if (
      wordStack.wordDetailCardComponent &&
      $wordCardElement[0] === wordStack.wordDetailCardComponent.element
    ) {
      this.targetWordCardComponent = wordStack.wordDetailCardComponent;
    } else {
      this.targetWordCardComponent = wordStack.getWordCardComponentByElement(
        $wordCardElement[0],
      );
    }

    if (!this.targetWordCardComponent) {
      return;
    }

    this.targetWordCardComponent.active = true;

    this.locked = true;
    this.sliding = true;
  }

  @HostListener('td-touch-end', ['$event'])
  onTouchEnd(): void {
    if (this.targetWordCardComponent) {
      this.targetWordCardComponent.active = false;
    }

    this.free();
  }

  @HostListener('td-slide-x', ['$event'])
  onSlideX(event: SlideXDelegateEvent): void {
    let {targetWordCardComponent, wordStack, slideXStartTime} = this;
    let touchData = event.detail;
    let isEnd = touchData.touch.isEnd;

    if (!targetWordCardComponent || (!this.sliding && !isEnd)) {
      return;
    }

    if (!this.slideXStartTime) {
      this.slideXStartTime = slideXStartTime = Date.now();
      targetWordCardComponent.element.classList.add('slide-x');
    }

    if (!targetWordCardComponent) {
      return;
    }

    targetWordCardComponent.onSlideX(
      touchData.diffX,
      slideXStartTime,
      isEnd,
      undefined,
      () => {
        targetWordCardComponent!.removed = true;
        wordStack.remove(targetWordCardComponent!.word);
        wordStack.stuff();

        if (targetWordCardComponent instanceof WordDetailCardComponent) {
          wordStack.hideWordDetail();
        }
      },
    );

    if (isEnd) {
      targetWordCardComponent.element.classList.remove('slide-x');
      this.free();
    }
  }

  @HostListener('td-polyline-after-slide-y', ['$event'])
  onPolylineAfterSlideY(event: PolylineDelegateEvent): void {
    let {targetWordCardComponent, wordStack, slideYStartTime} = this;
    let {wordCardComponents} = wordStack;
    let touchData = event.detail;
    let isEnd = touchData.touch.isEnd;

    if (!targetWordCardComponent || (!this.sliding && !isEnd)) {
      return;
    }

    if (!(targetWordCardComponent instanceof WordCardComponent)) {
      return;
    }

    if (!slideYStartTime) {
      this.slideYStartTime = slideYStartTime = Date.now();
      targetWordCardComponent.element.classList.add('slide-y');
    }

    if (!targetWordCardComponent) {
      return;
    }

    let {diffY, diffX} = touchData;

    if (diffX > SLIDE_Y_CHANGE_TO_SLIDE_X_OFFSET) {
      event.detail.diffX -= SLIDE_Y_CHANGE_TO_SLIDE_X_OFFSET;
      this.onSlideX(event);
    } else {
      targetWordCardComponent.onSlideY(
        diffY,
        slideYStartTime,
        isEnd,
        percentage => {
          for (let wordCardComponent of wordCardComponents) {
            if (
              wordCardComponent &&
              wordCardComponent.element !== targetWordCardComponent!.element
            ) {
              wordCardComponent.element.style.opacity = Math.max(
                1 - percentage,
                0.08,
              ) as any;
            }
          }
        },
        () => {
          wordStack.showWordDetail(targetWordCardComponent!.word);
        },
      );
    }

    if (isEnd) {
      targetWordCardComponent.element.classList.remove('slide-y');
      for (let wordCardComponent of wordCardComponents) {
        wordCardComponent.element.style.opacity = 1 as any;
      }
    }
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();
  }

  private free() {
    this.locked = false;
    this.sliding = false;
    // this.targetWordCardComponent = undefined;
    this.slideXStartTime = 0;
  }
}
