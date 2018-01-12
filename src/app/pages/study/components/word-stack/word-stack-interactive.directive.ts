import {Directive, Host, HostListener, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs/Subscription';

import * as $ from 'jquery';
import * as v from 'villa';

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
import {SnackbarHandler, SnackbarService} from 'app/ui';

import {WordCardComponentBase} from '../common/word-card-component-base';
import {WordCardComponent} from '../word-card/word-card.component';
import {WordDetailCardComponent} from '../word-detail-card/word-detail-card.component';
import {GuideStatus, WordStackComponent} from './word-stack.component';
import {WordStackService} from './word-stack.service';

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
  private briefsViewTime = 0;
  private subscriptions: Subscription[] = [];
  private restoreRemovedSnackbarHandler: SnackbarHandler | undefined;

  constructor(
    @Host() private wordStack: WordStackComponent,
    private userService: UserService,
    private wordStackService: WordStackService,
    private engineService: EngineService,
    private snackbarService: SnackbarService,
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
    let guideStatus = this.wordStack.guideStatus;

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

    if (
      guideStatus === GuideStatus.sliddenToRight ||
      guideStatus === GuideStatus.sliddenToRightAgain ||
      guideStatus === GuideStatus.enteredRemoveWordItemTraining
    ) {
      return;
    }

    if (!targetWordCardComponent) {
      let targetWordDetailCardComponent = this.wordStack
        .wordDetailCardComponent;

      if (targetWordDetailCardComponent && targetWordDetailCardComponent.lock) {
        return;
      }

      this.triggerHideWordDetail();
      return;
    }

    if (
      targetWordCardComponent &&
      targetWordCardComponent instanceof WordCardComponent
    ) {
      if (
        guideStatus === GuideStatus.started ||
        guideStatus === GuideStatus.viewedTermBriefs ||
        guideStatus === GuideStatus.canceledViewTermDetail
      ) {
        this.wordStack.guideStatus = GuideStatus.viewedTermDetail;
      }

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
    let wordStack = this.wordStack;
    let guideStatus = wordStack.guideStatus;

    event.preventDefault();
    event.detail.originalEvent.preventDefault();

    if (
      guideStatus !== GuideStatus.none &&
      guideStatus !== GuideStatus.slidingToRight &&
      guideStatus !== GuideStatus.sliddenToRight &&
      guideStatus !== GuideStatus.enteredRemoveWordItemTraining
    ) {
      return;
    }

    if (touchData.touch.sequences.length > 1 && !isEnd) {
      return;
    }

    let {targetWordCardComponent, wordStackService, slideXStartTime} = this;

    if (!targetWordCardComponent || !this.sliding) {
      return;
    }

    if (!slideXStartTime) {
      this.slideXStartTime = slideXStartTime = Date.now();
      this.slideYStartTime = 0;
      targetWordCardComponent.element.classList.add('slide-x');
    }

    let diffX = touchData.diffX;

    if (
      wordStack.guiding &&
      (guideStatus === GuideStatus.slidingToRight ||
        guideStatus === GuideStatus.sliddenToRight) &&
      diffX < 0
    ) {
      diffX = 0;
    }

    if (guideStatus === GuideStatus.enteredRemoveWordItemTraining) {
      diffX = Math.min(diffX, 0);
    }

    targetWordCardComponent.onSlideX(
      diffX,
      slideXStartTime,
      isEnd,
      undefined,
      async () => {
        if (diffX <= 0) {
          return;
        }

        targetWordCardComponent!.removed = true;
        wordStackService.remove(targetWordCardComponent!.word);

        await this.submit(targetWordCardComponent!.word.term);

        if (targetWordCardComponent instanceof WordDetailCardComponent) {
          wordStack.hideWordDetail();
          await v.sleep(280);
        }

        if (!wordStack.guideMode) {
          await wordStackService.fill();
        } else {
          if (guideStatus === GuideStatus.sliddenToRight) {
            wordStack.guideStatus = GuideStatus.sliddenToRightAgain;
          } else {
            wordStack.guideStatus = GuideStatus.sliddenToRight;
          }
        }
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
    let {wordCardComponents, guideStatus} = wordStack;

    if (
      guideStatus === GuideStatus.sliddenToRight ||
      guideStatus === GuideStatus.enteredRemoveWordItemTraining
    ) {
      return;
    }

    if (!targetWordCardComponent || (!this.sliding && !isEnd)) {
      return;
    }

    if (!(targetWordCardComponent instanceof WordCardComponent)) {
      this.reset();
      return;
    }

    let {diffY, diffX} = touchData;

    if (
      diffX > SLIDE_Y_CHANGE_TO_SLIDE_X_OFFSET &&
      !targetWordCardComponent.obstinate
    ) {
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

          if (
            guideStatus === GuideStatus.started ||
            guideStatus === GuideStatus.viewedTermBriefs ||
            guideStatus === GuideStatus.canceledViewTermDetail
          ) {
            wordStack.guideStatus = GuideStatus.viewedTermBriefs;
          }
        },
        () => {
          this.briefsViewTime += touchData.touch.timeLasting;
          wordStack.showWordDetail(targetWordCardComponent!.word);

          if (guideStatus === GuideStatus.viewedTermBriefs) {
            wordStack.guideStatus = GuideStatus.viewedTermDetail;
          }
        },
      );
    }

    if (isEnd) {
      for (let wordCardComponent of wordCardComponents) {
        wordCardComponent.element.style.opacity = 1 as any;
      }

      if (wordStack.guideStatus === GuideStatus.viewedTermBriefs) {
        wordStack.guideStatus = GuideStatus.canceledViewTermDetail;
      }

      let targetWordCardComponent = this.targetWordCardComponent;

      if (targetWordCardComponent && targetWordCardComponent.obstinate) {
        wordStack.showWordDetail(targetWordCardComponent.word);
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
    if (this.wordStack.guideMode) {
      return;
    }

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
      .then(async () => {
        this.wordStackService.remove(targetWordCardComponent.word);

        await this.submit(targetWordCardComponent.word.term, true);

        let wordStack = this.wordStack;

        if (!wordStack.guiding) {
          await this.wordStackService.fill();
        } else if (
          wordStack.guideStatus === GuideStatus.enteredRemoveWordItemTraining
        ) {
          wordStack.guideStatus = GuideStatus.removedWordItem;
        }

        if (this.restoreRemovedSnackbarHandler) {
          this.restoreRemovedSnackbarHandler.clear();
        }

        this.restoreRemovedSnackbarHandler = this.snackbarService.show(
          `已将单词 ${targetWordCardComponent.word.term} 移入回收站`,
          '撤回',
          10000,
        );

        try {
          await this.restoreRemovedSnackbarHandler.result;
          await this.wordStackService.restoreRecentRemovedWord();
        } catch (err) {
          logger.error(err);
        }

        this.restoreRemovedSnackbarHandler = undefined;
      })
      .catch(logger.error);
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
    let {wordStack} = this;

    wordStack.hideWordDetail();

    if (this.targetWordCardComponent) {
      this.targetWordCardComponent.active = false;
    }

    this.targetWordCardComponent = undefined;

    if (wordStack.guideStatus === GuideStatus.viewedTermDetail) {
      wordStack.guideStatus = GuideStatus.slidingToRight;
    }
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
