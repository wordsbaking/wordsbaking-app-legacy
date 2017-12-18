import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {asap} from 'rxjs/scheduler/asap';
import {Subscription} from 'rxjs/Subscription';

import {LoadingService} from 'app/ui';

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

  @ViewChildren(WordCardComponent)
  private wordCardComponentQueryList: QueryList<WordCardComponent>;

  private notificationTimerHandle: number;
  private subscription = new Subscription();

  constructor(
    ref: ElementRef,
    private wordStackService: WordStackService,
    private engineService: EngineService,
    private loadingService: LoadingService,
    private zone: NgZone,
  ) {
    this.element = ref.nativeElement;
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

  async ngOnInit(): Promise<void> {
    // 目的让页面过场动画不卡顿
    await new Promise<void>(resolve => setTimeout(resolve, 1000));

    this.subscription.add(
      this.engineService.load$.observeOn(asap).subscribe(async () => {
        let handler = this.loadingService.show('正在加载...');

        await this.engineService.ensureWordsData((state, percentage) => {
          switch (state) {
            case 'downloading':
              handler.setText(`正在下载单词释义 (${percentage}%)...`);
              break;
            case 'saving':
              handler.setText(`正在保存 (${percentage}%)...`);
              break;
          }
        });

        handler.clear();

        await this.wordStackService.stuff();

        this.zone.run(() => undefined);
      }),
    );
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

    this.activeWord$.next(word);
  }

  hideWordDetail(): void {
    let activeWord = this.activeWord$.value;
    if (activeWord) {
      let wordCardComponent = this.getWordCardComponentByWord(activeWord);

      if (wordCardComponent) {
        wordCardComponent.active = false;
      }
    }

    this.activeWord$.next(undefined);
  }

  showNotification(
    message: string,
    duration = 3000,
    status = NotificationStatus.info,
  ): void {
    clearTimeout(this.notificationTimerHandle);

    this.notification$.next({
      message,
      status,
    });

    this.notificationTimerHandle = setTimeout(
      () => this.hideNotification(),
      duration,
    );
  }

  hideNotification(): void {
    clearTimeout(this.notificationTimerHandle);
    this.notification$.next(undefined);
  }
}
