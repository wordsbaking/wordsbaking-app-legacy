import {Directive, Host, HostListener, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs/Subscription';

import * as $ from 'jquery';

import * as logger from 'logger';

import {
  PolylineDelegateEvent,
  PressDelegateEvent,
  SlideXDelegateEvent,
  TouchDelegate,
  TouchEndDelegateEvent,
  TouchIdentifier,
  TouchStartDelegateEvent,
} from 'app/lib/touch-delegate';

import {VIEW_BRIEFS_UNKNOWN_LIMIT} from 'app/constants';
import {EngineService, MemorizingStatus} from 'app/core/engine';
import {UserService} from 'app/core/user';

import {WordCardComponentBase} from '../common/word-card-component-base';
import {WordCardComponent} from '../word-card/word-card.component';
import {WordDetailCardComponent} from '../word-detail-card/word-detail-card.component';
import {WordStackComponent} from './word-stack.component';
import {WordStackService} from './word-stack.service';

interface WordCardStatus {
  viewedbriefs: boolean;
}

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
  private preventTapEvent = false;
  private viewedBriefs = false;
  private viewedDetails = false;
  private briefsViewTime = 0;
  private subscriptions: Subscription[] = [];
  private wordCardStatusMap = new Map<string, WordCardStatus>();

  constructor(
    @Host() private wordStack: WordStackComponent,
    private userService: UserService,
    private wordStackService: WordStackService,
    private engineService: EngineService,
  ) {
    this.touchDelegate = new TouchDelegate(wordStack.element, false);
    this.touchDelegate.bind(TouchIdentifier.touchStart);
    this.touchDelegate.bind(TouchIdentifier.touchEnd);
    this.touchDelegate.bind(TouchIdentifier.slideX);
    this.touchDelegate.bind(TouchIdentifier.polylineAfterSlideY);
    this.touchDelegate.bind(TouchIdentifier.press);

    this.subscriptions.push(
      wordStack.activeWord$.subscribe(word => {
        if (word) {
          this.preventTapEvent = true;
          setTimeout(() => (this.preventTapEvent = false), 500);
        } else {
          this.preventTapEvent = false;
        }
      }),
    );
  }

  @HostListener('td-press', ['$event'])
  onTap(event: PressDelegateEvent): void {
    // TODO: unreliable
    if (event.detail.originalEvent.type === 'mouseup') {
      return;
    }

    if (this.preventTapEvent) {
      return;
    }

    let $targetElement = $(event.detail.target);
    let targetWordCardComponent = this.resolveWordCardComponent(event.detail
      .target as HTMLElement);

    if ($targetElement.closest('.J-trigger-remove').length) {
      if (
        targetWordCardComponent &&
        targetWordCardComponent instanceof WordCardComponent
      ) {
        this.triggerRemoveWordCardComponent(targetWordCardComponent);
        return;
      }
    }

    if (!targetWordCardComponent) {
      this.triggerHideWordDetail();
      return;
    }

    if (
      targetWordCardComponent &&
      targetWordCardComponent instanceof WordCardComponent
    ) {
      this.triggerShowWordDetail(targetWordCardComponent);
      return;
    }
  }

  @HostListener('td-touch-start', ['$event'])
  onTouchStart(event: TouchStartDelegateEvent): void {
    let eventData = event.detail;

    if (eventData.originalEvent.type === 'mouseup') {
      return;
    }

    if (eventData.touch.sequences.length > 1) {
      return;
    }

    let {wordStack} = this;

    if (!wordStack.enabledWordCardTransitions) {
      wordStack.enabledWordCardTransitions = true;
    }

    if (this.locked) {
      return;
    }

    let $target = $(event.detail.target);

    if ($target.closest('.prevent-slide').length) {
      return;
    }

    let $wordCardElement = $target.closest(
      'wb-study-view-word-card, wb-study-view-word-detail-card .inner',
    );

    if ($wordCardElement.length === 0) {
      if (this.targetWordCardComponent) {
        this.targetWordCardComponent.active = false;
      }

      this.targetWordCardComponent = undefined;
      return;
    }

    if ($wordCardElement.hasClass('inner')) {
      $wordCardElement = $wordCardElement.closest(
        'wb-study-view-word-detail-card',
      );
    }

    let targetWordCardComponent: WordCardComponentBase | undefined;

    if (
      wordStack.wordDetailCardComponent &&
      $wordCardElement[0] === wordStack.wordDetailCardComponent.element
    ) {
      targetWordCardComponent = wordStack.wordDetailCardComponent;
    } else {
      targetWordCardComponent = wordStack.getWordCardComponentByElement(
        $wordCardElement[0],
      );
    }

    if (
      this.targetWordCardComponent &&
      this.targetWordCardComponent !== targetWordCardComponent
    ) {
      this.targetWordCardComponent.active = false;
    }

    if (!targetWordCardComponent) {
      return;
    }

    targetWordCardComponent.active = true;

    if (
      this.targetWordCardComponent &&
      this.targetWordCardComponent.word.term !==
        targetWordCardComponent.word.term
    ) {
      this.viewedBriefs = false;
      this.briefsViewTime = 0;
    }

    this.targetWordCardComponent = targetWordCardComponent;
    this.locked = true;
    this.sliding = true;
    this.slideXStartTime = 0;
    this.slideYStartTime = 0;
  }

  @HostListener('td-touch-end', ['$event'])
  onTouchEnd(event: TouchEndDelegateEvent): void {
    let eventData = event.detail;

    if (eventData.originalEvent.type === 'mouseup') {
      return;
    }

    this.userService.triggerStudyHeartBeat();

    if (event.detail.touch.sequences.length > 1) {
      if (this.slideXStartTime && this.sliding) {
        this.onSlideX(event);
      } else if (this.slideYStartTime && this.sliding) {
        this.onPolylineAfterSlideY((event as any) as PolylineDelegateEvent);
      }

      this.reset();
    } else if (!this.slideXStartTime && !this.slideYStartTime) {
      this.reset();
    }
  }

  @HostListener('td-slide-x', ['$event'])
  onSlideX(event: SlideXDelegateEvent): void {
    let touchData = event.detail;
    let isEnd = touchData.touch.isEnd;

    event.preventDefault();
    event.detail.originalEvent.preventDefault();

    if (touchData.touch.sequences.length > 1 && !isEnd) {
      return;
    }

    let {
      targetWordCardComponent,
      wordStack,
      wordStackService,
      slideXStartTime,
    } = this;

    if (!targetWordCardComponent || !this.sliding) {
      return;
    }

    if (!slideXStartTime) {
      this.slideXStartTime = slideXStartTime = Date.now();
      this.slideYStartTime = 0;
      targetWordCardComponent.element.classList.add('slide-x');
    }

    targetWordCardComponent.onSlideX(
      touchData.diffX,
      slideXStartTime,
      isEnd,
      undefined,
      () => {
        if (touchData.diffX <= 0) {
          return;
        }

        targetWordCardComponent!.removed = true;
        wordStackService.remove(targetWordCardComponent!.word);

        if (targetWordCardComponent instanceof WordDetailCardComponent) {
          wordStack.hideWordDetail();
          setTimeout(() => wordStackService.stuff().catch(logger.error), 280);
        } else {
          wordStackService.stuff().catch(logger.error);
        }

        this.submit(targetWordCardComponent!.word.term).catch(logger.error);
      },
    );

    if (isEnd) {
      this.reset();
    }
  }

  @HostListener('td-polyline-after-slide-y', ['$event'])
  onPolylineAfterSlideY(event: PolylineDelegateEvent): void {
    let touchData = event.detail;
    let isEnd = touchData.touch.isEnd;

    event.preventDefault();
    event.detail.originalEvent.preventDefault();

    if (touchData.touch.sequences.length > 1 && !isEnd) {
      return;
    }

    let {targetWordCardComponent, wordStack, slideYStartTime} = this;
    let {wordCardComponents} = wordStack;

    if (!targetWordCardComponent || (!this.sliding && !isEnd)) {
      return;
    }

    if (!(targetWordCardComponent instanceof WordCardComponent)) {
      this.reset();
      return;
    }

    let {diffY, diffX} = touchData;

    if (diffX > SLIDE_Y_CHANGE_TO_SLIDE_X_OFFSET) {
      event.detail.diffX -= SLIDE_Y_CHANGE_TO_SLIDE_X_OFFSET;
      this.onSlideX(event);
    } else {
      if (!slideYStartTime) {
        this.slideYStartTime = slideYStartTime = Date.now();
        this.slideXStartTime = 0;

        targetWordCardComponent.element.classList.add('slide-y');
      }

      targetWordCardComponent.onSlideY(
        diffY,
        slideYStartTime,
        isEnd,
        (percentage, statsSet) => {
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

          if (!this.viewedBriefs && statsSet.has('viewed-briefs')) {
            this.viewedBriefs = true;
          }
        },
        () => {
          this.briefsViewTime += touchData.touch.timeLasting;
          wordStack.showWordDetail(targetWordCardComponent!.word);
        },
      );
    }

    if (isEnd) {
      for (let wordCardComponent of wordCardComponents) {
        wordCardComponent.element.style.opacity = 1 as any;
      }

      this.reset();
    }
  }

  ngOnDestroy(): void {
    this.touchDelegate.destroy();

    for (let subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  private async submit(
    term: string,
    removedToRecycleBin = false,
  ): Promise<void> {
    let status: MemorizingStatus;

    if (removedToRecycleBin) {
      status = MemorizingStatus.removed;
    } else if (
      this.viewedBriefs &&
      this.briefsViewTime >= VIEW_BRIEFS_UNKNOWN_LIMIT
    ) {
      status = MemorizingStatus.unknown;
    } else if (this.viewedBriefs) {
      status = MemorizingStatus.uncertain;
    } else {
      status = MemorizingStatus.known;
    }

    await this.engineService.submit(term, {
      status,
    });

    // this.engineService
    //   .submit(this.term, {
    //     status,
    //   })
    //   .then(stats => {
    //     user.updateTodayStudyStats(stats);
    //     updateStats(stats);
    //   });
  }

  private triggerRemoveWordCardComponent(
    targetWordCardComponent: WordCardComponent,
  ): void {
    targetWordCardComponent
      .remove()
      .then(() => {
        this.wordStackService.remove(targetWordCardComponent.word);
        this.wordStackService.stuff().catch(logger.error);
        this.submit(targetWordCardComponent.word.term, true).catch(
          logger.error,
        );
      })
      .catch(() => undefined);
  }

  private triggerShowWordDetail(
    targetWordCardComponent: WordCardComponent,
  ): void {
    let expandedRemovalConfirmButtons =
      targetWordCardComponent.expandedRemovalConfirmButtons;

    if (this.targetWordCardComponent) {
      this.targetWordCardComponent.active = false;
    }

    if (expandedRemovalConfirmButtons) {
      return;
    }

    this.wordStack.showWordDetail(targetWordCardComponent.word);

    targetWordCardComponent.active = true;
    this.targetWordCardComponent = targetWordCardComponent;
  }

  private triggerHideWordDetail(): void {
    this.wordStack.hideWordDetail();

    if (this.targetWordCardComponent) {
      this.targetWordCardComponent.active = false;
    }

    this.targetWordCardComponent = undefined;
  }

  private resolveWordCardComponent(
    target: HTMLElement,
  ): WordCardComponentBase | undefined {
    let $wordCardElement = $(target).closest(
      'wb-study-view-word-card, wb-study-view-word-detail-card',
    );

    if ($wordCardElement.length === 0) {
      return undefined;
    }

    return this.wordStack.getWordCardComponentByElement($wordCardElement[0]);
  }

  private reset(): void {
    let {targetWordCardComponent} = this;

    if (targetWordCardComponent) {
      targetWordCardComponent.element.classList.remove('slide-y');
      targetWordCardComponent.element.classList.remove('slide-x');
    }

    this.slideXStartTime = 0;
    this.slideYStartTime = 0;
    this.sliding = false;
    this.locked = false;
  }
}
