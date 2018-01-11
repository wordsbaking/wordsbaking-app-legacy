import {
  Component,
  ElementRef,
  HostBinding,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import * as v from 'villa';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {asap} from 'rxjs/scheduler/asap';
import {Subscription} from 'rxjs/Subscription';

import {LoadingHandler, LoadingService} from 'app/ui';

import {SettingsConfigService, UserConfigService} from 'app/core/config';
import {EngineService, WordInfo} from 'app/core/engine';

import {
  WORD_CARD_HEIGHT,
  WORD_CARD_SEPARATE,
  WordCardComponentBase,
} from '../common/word-card-component-base';

import {
  Notification,
  NotificationStatus,
} from '../notification-card/notification-card.component';
import {WordCardComponent} from '../word-card/word-card.component';
import {WordDetailCardComponent} from '../word-detail-card/word-detail-card.component';

import {WordStackService} from './word-stack.service';

import {
  notificationCardTransitions,
  wordCardTransitions,
} from './word-stack.animations';

export const enum GuideStatus {
  none,
  entered,
  started,
  viewedTermBriefs,
  canceledViewTermDetail,
  viewedTermDetail,
  slidingToRight,
  sliddenToRight,
  sliddenToRightAgain,
  enteredRemoveWordItemHint,
  enteredRemoveWordItemTraining,
  removedWordItem,
  enteredAudioPlaySwitchHint,
  ended,
}

@Component({
  selector: 'wb-study-view-word-stack',
  templateUrl: './word-stack.component.html',
  styleUrls: ['./word-stack.component.less'],
  animations: [notificationCardTransitions, wordCardTransitions],
  providers: [WordStackService],
})
export class WordStackComponent implements OnInit, OnDestroy {
  @ViewChild(WordDetailCardComponent)
  wordDetailCardComponent: WordDetailCardComponent;

  words$ = this.wordStackService.words$;

  notification$ = new BehaviorSubject<Notification | undefined>(undefined);

  element: HTMLElement;

  enabledWordCardTransitions = false;
  enabledNotificationCardTransitions = true;

  activeWord$ = new BehaviorSubject<WordInfo | undefined>(undefined);

  startingGuide = false;

  @HostBinding('class.viewing-obstinate-word')
  get viewingObstinateWord(): boolean {
    let activeWord = this.activeWord$.value;

    return !!activeWord && activeWord.obstinate;
  }

  private dailyStudyPlanAndStats$ = this.settingsConfigService.dailyStudyPlan$
    .combineLatest(this.engineService.stats$)
    .publishReplay(1)
    .refCount();

  private todayDone$ = this.dailyStudyPlanAndStats$
    .map(
      ([plan, {todayNew, todayReviewed}]) =>
        Math.min(todayNew, plan) + todayReviewed,
    )
    .publishReplay(1)
    .refCount();

  private todayGoal$ = this.dailyStudyPlanAndStats$
    .map(([plan, {todayReviewGoal}]) => plan + todayReviewGoal)
    .publishReplay(1)
    .refCount();

  todayProgressPercentage$ = this.todayDone$
    .combineLatest(this.todayGoal$)
    .map(([done, goal]) => done / (goal || 1) * 100)
    .publishReplay(1)
    .refCount();

  @ViewChildren(WordCardComponent)
  private wordCardComponentQueryList: QueryList<WordCardComponent>;

  private notificationTimerHandle: number;
  private subscription = new Subscription();
  private currentGuideStatus: GuideStatus = GuideStatus.none;
  private previousGuideStatus: GuideStatus = GuideStatus.none;

  private notifiedTodayGoalFinished = false;

  constructor(
    ref: ElementRef,
    private wordStackService: WordStackService,
    private engineService: EngineService,
    private settingsConfigService: SettingsConfigService,
    private userConfigService: UserConfigService,
    private loadingService: LoadingService,
    private zone: NgZone,
  ) {
    this.element = ref.nativeElement;

    this.subscription.add(
      this.userConfigService.lastActiveAt$
        .combineLatest(this.todayProgressPercentage$)
        .subscribe(([lastActiveAt, percentage]) => {
          if (
            Date.now() - lastActiveAt < 300 &&
            percentage >= 100 &&
            !this.notifiedTodayGoalFinished
          ) {
            this.showNotification('今日任务完成', 3000);
          }

          if (percentage >= 100) {
            this.notifiedTodayGoalFinished = true;
          }
        }),
    );
  }

  get size(): number {
    return this.words$.value.length;
  }

  get wordListWrapperHeight(): string {
    let {size} = this;

    return `${size * WORD_CARD_HEIGHT + WORD_CARD_SEPARATE * (size - 1)}px`;
  }

  get words(): (WordInfo | undefined)[] {
    return this.words$.value;
  }

  get wordCardComponents(): WordCardComponent[] {
    return this.wordCardComponentQueryList
      .toArray()
      .filter(wordCardComponent => !wordCardComponent.removed);
  }

  get guideMode(): boolean {
    return this.guideStatus !== GuideStatus.none;
  }

  get guiding(): boolean {
    return (
      this.guideStatus !== GuideStatus.none &&
      this.guideStatus !== GuideStatus.entered
    );
  }

  get guideEnded(): boolean {
    return this.guideStatus === GuideStatus.ended;
  }

  get guideStatus(): GuideStatus {
    return this.currentGuideStatus;
  }

  set guideStatus(guideStatus: GuideStatus) {
    this.currentGuideStatus = guideStatus;
    this.updateGuide();
    this.previousGuideStatus = guideStatus;
  }

  get continueGuideButtonVisibility(): boolean {
    let guideStatus = this.guideStatus;

    return (
      guideStatus === GuideStatus.sliddenToRightAgain ||
      guideStatus === GuideStatus.enteredRemoveWordItemHint ||
      guideStatus === GuideStatus.removedWordItem ||
      guideStatus === GuideStatus.enteredAudioPlaySwitchHint
    );
  }

  async ngOnInit(): Promise<void> {
    // 目的让页面过场动画不卡顿
    await v.sleep(1000);

    let showGuide = await this.settingsConfigService.showGuide$
      .first()
      .toPromise();

    if (showGuide) {
      this.guideStatus = GuideStatus.entered;
    } else {
      this.initializeWords();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getWordCardComponentByIndex(
    index: number,
  ): WordCardComponentBase | undefined {
    let wordCardComponent = this.wordCardComponentQueryList.toArray()[index];

    if (wordCardComponent.removed) {
      return undefined;
    }

    return wordCardComponent;
  }

  getWordCardComponentByWord(
    word: WordInfo,
  ): WordCardComponentBase | undefined {
    let wordCardComponents = this.wordCardComponentQueryList.toArray();

    for (let wordCardComponent of wordCardComponents) {
      if (wordCardComponent.word === word && !wordCardComponent.removed) {
        return wordCardComponent;
      }
    }

    return undefined;
  }

  getWordCardComponentByTerm(term: string): WordCardComponentBase | undefined {
    let wordCardComponents = this.wordCardComponentQueryList.toArray();

    for (let wordCardComponent of wordCardComponents) {
      if (wordCardComponent.word.term === term && !wordCardComponent.removed) {
        return wordCardComponent;
      }
    }

    return undefined;
  }

  getWordCardComponentByElement(
    element: HTMLElement,
  ): WordCardComponentBase | undefined {
    let wordCardComponents = this.wordCardComponentQueryList.toArray();

    for (let wordCardComponent of wordCardComponents) {
      if (wordCardComponent.element === element && !wordCardComponent.removed) {
        return wordCardComponent;
      }
    }

    return undefined;
  }

  calculateWordCardTopPosition(index: number): string {
    return `${index * WORD_CARD_HEIGHT + index * WORD_CARD_SEPARATE}px`;
  }

  showWordDetail(word: WordInfo): void {
    let wordCardComponent = this.getWordCardComponentByWord(word);

    if (!wordCardComponent || wordCardComponent.removed) {
      return;
    }

    wordCardComponent.active = true;

    this.activeWord$.next({
      ...word,
      obstinate: wordCardComponent.obstinate,
    });
  }

  hideWordDetail(): void {
    let activeWord = this.activeWord$.value;
    if (activeWord) {
      let wordCardComponent = this.getWordCardComponentByTerm(activeWord.term);

      if (wordCardComponent) {
        wordCardComponent.active = false;
        wordCardComponent.obstinate = false;
      }
    }

    this.activeWord$.next(undefined);
  }

  showNotification(
    message: string,
    duration = 0,
    status = NotificationStatus.info,
  ): void {
    clearTimeout(this.notificationTimerHandle);

    this.notification$.next({
      message,
      status,
    });

    if (duration) {
      this.notificationTimerHandle = setTimeout(
        () => this.hideNotification(),
        duration,
      );
    }
  }

  hideNotification(): void {
    clearTimeout(this.notificationTimerHandle);
    this.notification$.next(undefined);
  }

  continueGuide(): void {
    switch (this.guideStatus) {
      case GuideStatus.sliddenToRightAgain:
        this.guideStatus = GuideStatus.enteredRemoveWordItemHint;
        break;
      case GuideStatus.enteredRemoveWordItemHint:
        this.guideStatus = GuideStatus.enteredRemoveWordItemTraining;
        break;
      case GuideStatus.removedWordItem:
        this.guideStatus = GuideStatus.enteredAudioPlaySwitchHint;
        break;
      case GuideStatus.enteredAudioPlaySwitchHint:
        this.guideStatus = GuideStatus.ended;
        break;
    }
  }

  async skipGuide(): Promise<void> {
    this.guideStatus = GuideStatus.none;
    await this.settingsConfigService.set('showGuide', false);
    this.initializeWords();
  }

  showGuideAgain(): void {
    this.guideStatus = GuideStatus.entered;
  }

  startGuide(): void {
    this.guideStatus = GuideStatus.started;
  }

  async startStudy(): Promise<void> {
    await this.settingsConfigService.set('showGuide', false);

    this.guideStatus = GuideStatus.none;

    this.initializeWords();
  }

  private initializeWords(): void {
    let handler: LoadingHandler<void>;

    let timerHandle = setTimeout(() => {
      handler = this.loadingService.show('正在加载...');
    }, 100);

    this.subscription.add(
      this.engineService.load$
        .observeOn(asap)
        .first()
        .subscribe(async () => {
          await this.engineService.ensureWordsData((state, percentage) => {
            switch (state) {
              case 'downloading':
                if (handler) {
                  handler.setText(`正在下载单词释义 (${percentage}%)...`);
                }
                break;
              case 'saving':
                if (handler) {
                  handler.setText(`正在保存 (${percentage}%)...`);
                }
                break;
            }
          });

          await this.wordStackService.fill();

          clearTimeout(timerHandle);

          if (handler) {
            handler.clear();
          }

          this.zone.run(() => undefined);
        }),
    );
  }

  private updateGuide(): void {
    let {currentGuideStatus} = this;

    switch (currentGuideStatus) {
      case GuideStatus.none:
        this.hideNotification();
        break;
      case GuideStatus.entered:
        this.showNotification('欢迎使用词焙, 我是使用向导哟~');
        break;
      case GuideStatus.started:
        this.showNotification('遇到不认识的单词时, 按住下拉查看释义.');
        this.wordStackService.add({
          term: '下拉我',
          prons: {
            gb: ['xia la wo'],
            us: ['xia la wo'],
          },
          briefs: [
            {
              poss: [],
              text: '这里是简短释义',
            },
          ],
          meanings: [
            {
              poss: [],
              text: '这里是详细释义, 以后可以直接右滑详细释义哟 (但是在向导里不行哈哈哈)~',
            },
          ],
          sentences: [
            {
              s: '这里是例句',
              t: '以后点我可以朗读哟~',
            },
          ],
          new: true,
          marked: false,
          obstinate: false,
          needRemoveConfirm: false,
        });
        break;
      case GuideStatus.viewedTermBriefs:
        this.showNotification('棒~ 加号变色时释放就可以查看详细释义了.');
        break;
      case GuideStatus.canceledViewTermDetail:
        this.showNotification('赞! 继续下拉至加号变色.');
        break;
      case GuideStatus.viewedTermDetail:
        this.showNotification('接下来点击空白处 (详细释义上下方的灰色区域) 关闭详细释义~');
        break;
      case GuideStatus.slidingToRight:
        this.showNotification('嗯, 现在将词条向右划出屏幕吧!');

        this.wordStackService.empty();

        this.wordStackService.add({
          term: '现在右滑',
          prons: {
            gb: ['xian zai you hua'],
            us: ['xian zai you hua'],
          },
          briefs: [
            {
              poss: [],
              text: '这里是简短释义',
            },
          ],
          meanings: [
            {
              poss: [],
              text: '这里是详细释义, 以后可以直接右滑详细释义哟 (但是在向导里不行哈哈哈)~',
            },
          ],
          sentences: [
            {
              s: '这里是例句',
              t: '以后点我可以朗读哟~',
            },
          ],
          new: true,
          marked: false,
          obstinate: false,
          needRemoveConfirm: false,
        });
        break;
      case GuideStatus.sliddenToRight:
        this.showNotification('撒花~ 如果遇到认识的单词, 直接滑出~');
        this.wordStackService.empty();

        this.wordStackService.add({
          term: '右滑我',
          prons: {
            gb: ['you hua wo'],
            us: ['you hua wo'],
          },
          briefs: [],
          meanings: [],
          sentences: [],
          new: true,
          marked: false,
          obstinate: false,
          needRemoveConfirm: false,
        });
        break;
      case GuideStatus.sliddenToRightAgain:
        this.showNotification(
          `
            <p>好~ 另外对于不熟悉的单词, 你也可以先下拉查看释义, 不用放开手指, 快速记忆后继续向右滑出. 也可以直接点击词条查看详细释义.</p>
            <p><b>词焙是通过是否查看了释义来判断用户是否记住单词的</b>, 所以如果一直查看释义的话, 词焙就会一直认为你没有记住哦!</p>
          `,
        );
        break;
      case GuideStatus.enteredRemoveWordItemHint:
        this.showNotification('对于自己平时就经常使用, 早已熟知的单词, 可以放进回收站.');
        break;
      case GuideStatus.enteredRemoveWordItemTraining:
        this.showNotification('按住词条, <b>先左划</b>, 再在点击 <b>太简单了</b> 按钮.');

        this.wordStackService.empty();

        this.wordStackService.add({
          term: '删除我',
          prons: {
            gb: ['shan chu wo'],
            us: ['shan chu wo'],
          },
          briefs: [],
          meanings: [],
          sentences: [],
          new: true,
          marked: false,
          obstinate: false,
          needRemoveConfirm: false,
        });
        break;
      case GuideStatus.removedWordItem:
        this.showNotification(`
          <p>就是这样~ 但请一定不要滥用回收站哦! 回收站并不是为记住的单词准备的, 而是为对你来说非常非常简单, 到挂掉都不会忘的单词准备的!</p>
          <p>一般情况下记住了单词请直接右滑, 词焙会自动安排复习, 并逐渐延长复习间隔至几个月~</p>
        `);
        break;
      case GuideStatus.enteredAudioPlaySwitchHint:
        this.showNotification('另外, 点击右上方 (也就是时间与头像附近) 可以打开折叠的快捷开关~');
        break;
      case GuideStatus.ended:
        this.showNotification(
          '那基本的使用方法就是这样啦, 因为做向导太繁琐了, 更多细节可以进入 "设置" 页面下方打开词焙 FAQ 查看. =3=',
        );
        break;
    }
  }
}
