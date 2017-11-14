import {
  animate as angularAnimate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';

import * as $ from 'jquery';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {WordInfo} from 'app/core/engine';

import {
  PolylineDelegateEvent,
  SlideXDelegateEvent,
  TapDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
  TouchStartDelegateEvent,
} from 'app/lib/touch-delegate';

import {Easing, animate, momentum} from 'app/lib/animate';

import {WordCardComponent} from '../word-card/word-card.component';

const simulationData: WordInfo[] = [
  {
    term: 'amount',
    prons: {
      us: ["ə'maʊnt"],
    },
    meanings: [
      {
        poss: ['n'],
        text: '数量, 总数，总额，全部效果，全部含义',
      },
      {
        poss: ['vi'],
        text: '合计，总计，共计,(在意义,价值,效果,程度等方面)等于，总共',
      },
    ],
    briefs: [
      {
        poss: ['n'],
        text: '数量, 总数，总额，全部效果，全部含义',
      },
      {
        poss: ['vi'],
        text: '合计，总计，共计,(在意义,价值,效果,程度等方面)等于，总共',
      },
    ],
    sentences: [
      {
        s: 'They have only a vague idea of the amount of water available.',
        t: '他们只是大概知道可用水的问量',
      },
    ],
    new: true,
    marked: true,
    obstinate: true,
    needRemoveConfirm: false,
  },
  {
    term: 'Sweden',
    prons: {
      us: ["'swidn"],
    },
    meanings: [
      {
        poss: ['n'],
        text: '瑞士',
      },
    ],
    briefs: [
      {
        poss: ['n'],
        text: '瑞士',
      },
    ],
    sentences: [
      {
        s: 'A variety of Russian goods are forwarded through Sweden.',
        t: '各种俄国货都是由瑞士转运的.',
      },
    ],
    new: true,
    marked: false,
    obstinate: false,
    needRemoveConfirm: false,
  },
  {
    term: 'Berlin',
    prons: {
      us: ["bə'lɪn"],
    },
    meanings: [
      {
        poss: ['n'],
        text: '柏林（前民主德国首都）； （亦作B-）柏林细软毛线； （b-）四轮双座篷盖马车； 附有马车夫站台',
      },
    ],
    briefs: [
      {
        poss: ['n'],
        text: '柏林（前民主德国首都）； （亦作B-）柏林细软毛线； （b-）四轮双座篷盖马车； 附有马车夫站台',
      },
    ],
    sentences: [
      {
        s: 'Berlin and its environs',
        t: '柏林及周围地区',
      },
    ],
    new: false,
    marked: true,
    obstinate: false,
    needRemoveConfirm: false,
  },
  {
    term: 'tennis',
    prons: {
      us: ["'tenɪs"],
    },
    meanings: [
      {
        poss: ['n'],
        text: '网球(运动)',
      },
    ],
    briefs: [
      {
        poss: ['n'],
        text: '网球(运动)',
      },
    ],
    sentences: [
      {
        s:
          'My hobbies are letter writing, foot-ball, music, photography and tennis.',
        t: '我的业余爱好是写信、踢足球、听音乐、玩摄影和打网球。',
      },
    ],
    new: false,
    marked: false,
    obstinate: true,
    needRemoveConfirm: false,
  },
  {
    term: 'server',
    prons: {
      us: ["'sɜrvər"],
    },
    meanings: [
      {
        poss: ['n'],
        text: '服务员)',
      },
    ],
    briefs: [
      {
        poss: ['n'],
        text: '服务员',
      },
    ],
    sentences: [],
    new: false,
    marked: false,
    obstinate: true,
    needRemoveConfirm: false,
  },
];

const WORD_CARD_HEIGHT = 50;
const WORD_CARD_SEPARATE = 15;
const WORD_CARD_WIDTH = 320;

@Component({
  selector: 'wb-study-view-word-stack',
  templateUrl: './word-stack.component.html',
  styleUrls: ['./word-stack.component.less'],
  animations: [
    trigger('wordCardTransitions', [
      transition('void => true', [
        style({opacity: 0, transform: 'scale(0.9)'}),
        angularAnimate(
          '0.2s linear',
          style({opacity: 1, transform: 'scale(1)'}),
        ),
      ]),
      transition('true => void', [
        angularAnimate('0.2s ease-out', style({opacity: 0})),
      ]),
    ]),
  ],
})
export class WordStackComponent implements AfterViewInit, OnDestroy {
  @ViewChildren(WordCardComponent)
  wordItemQueryList: QueryList<WordCardComponent>;

  words$ = new BehaviorSubject<WordInfo[]>([]);

  element: HTMLElement;

  @HostBinding('@wordCardTransitions') enabledWordCardTransitions = false;

  activeWord$ = new BehaviorSubject<WordInfo | undefined>(undefined);

  private touchDelegate: TouchDelegate;
  private wordItemMap = new Map<HTMLElement, WordCardComponent>();
  private targetWordCardComponent: WordCardComponent | undefined;
  private locked = false;
  private sliding = false;
  private slidXStartTime = 0;

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;
    this.touchDelegate = new TouchDelegate(this.element, true);
    this.touchDelegate.bind(TouchIdentifier.touchStart);
    this.touchDelegate.bind(TouchIdentifier.touchEnd);
    this.touchDelegate.bind(TouchIdentifier.slideX);
    this.touchDelegate.bind(TouchIdentifier.polylineAfterSlideY);
    this.touchDelegate.bind(TouchIdentifier.tap);
    this.words$.next(simulationData.slice());
  }

  get size(): number {
    return this.words$.value.length;
  }

  get wordListWrapperHeight(): string {
    let {size} = this;

    return `${size * WORD_CARD_HEIGHT + WORD_CARD_SEPARATE * (size - 1)}px`;
  }

  @HostListener('td-tap', ['$event'])
  onTouchTap(event: TapDelegateEvent): void {
    let $targetElement = $(event.detail.target);
    let $wordCardElement = $targetElement.closest(
      'wb-study-view-word-card-detail, wb-study-view-word-card',
    );

    if (!$wordCardElement.length) {
      this.activeWord$.next(undefined);
      return;
    }

    switch ($wordCardElement[0].nodeName.toLowerCase()) {
      case 'wb-study-view-word-card-detail':
        this.activeWord$.next(undefined);
        break;

      case 'wb-study-view-word-card': {
        let targetWordCardComponent = this.wordItemMap.get($wordCardElement[0]);

        if (!targetWordCardComponent) {
          return;
        }

        this.activeWord$.next(targetWordCardComponent.word);
        break;
      }
    }
  }

  @HostListener('td-touch-start', ['$event'])
  onTouchStart(event: TouchStartDelegateEvent): void {
    if (this.locked) {
      return;
    }

    let $target = $(event.detail.target);
    let $wordItemElement = $target.closest('wb-study-view-word-card');

    this.targetWordCardComponent = this.wordItemMap.get($wordItemElement[0]);
    this.locked = true;
  }

  @HostListener('td-touch-end')
  onTouchEnd(): void {
    if (!this.sliding) {
      this.targetWordCardComponent = undefined;
      this.locked = false;
      this.slidXStartTime = 0;
    }
  }

  @HostListener('td-slide-x', ['$event'])
  async onSlideX(event: SlideXDelegateEvent): Promise<void> {
    if (!this.slidXStartTime) {
      this.slidXStartTime = Date.now();
    }

    this.slideToggleMarked(event).catch(() => undefined);

    if (event.detail.touch.isEnd) {
      this.locked = false;
      this.sliding = false;
      this.targetWordCardComponent = undefined;
      this.slidXStartTime = 0;
    }
  }

  @HostListener('td-polyline-after-slide-y', ['$event'])
  onSlideY(event: PolylineDelegateEvent): void {
    let isEnd = event.detail.touch.isEnd;
    let {targetWordCardComponent} = this;

    if (isEnd) {
      for (let [, wordCardComponent] of this.wordItemMap) {
        wordCardComponent.elementStyle.opacity = 1 as any;
      }
    }

    if (!targetWordCardComponent) {
      return;
    }

    this.sliding = true;

    let {
      briefElement,
      briefElementStyle,
      labelInnerWrapperElementStyle,
      audioIconElementStyle,
    } = targetWordCardComponent;
    let {diffY, diffX} = event.detail;
    let scrollHeight = briefElement.scrollHeight;
    let triggerShowDetailHeight = 90;

    if (isEnd) {
      this.onSlideX(event as any).catch(() => undefined);

      targetWordCardComponent.setInactive();
      briefElementStyle.height = 0 as any;
      briefElementStyle.opacity = 0 as any;
      audioIconElementStyle.opacity = 1 as any;
      targetWordCardComponent.element.classList.remove('slide-y');

      this.locked = false;
      this.sliding = false;
      this.targetWordCardComponent = undefined;

      if (
        diffX <= 0 &&
        (diffY - scrollHeight) / triggerShowDetailHeight > 0.6
      ) {
        this.showWordDetail(targetWordCardComponent.word);
      }

      return;
    }

    if (diffX > 0) {
      targetWordCardComponent.element.classList.remove('slide-y');
      labelInnerWrapperElementStyle.transform = `translateY(0%)`;
      this.onSlideX(event as any).catch(() => undefined);
      return;
    }

    targetWordCardComponent.element.classList.add('slide-y');

    let height = Math.max(diffY, 0);
    let percentage = height / scrollHeight;

    briefElementStyle.height = `${Math.min(scrollHeight, height)}px`;

    if (!targetWordCardComponent.active && percentage > 0.2) {
      targetWordCardComponent.setActive();
    }

    if (percentage > 0.1) {
      let audioIconOpacity = 1 - Math.min(percentage - 0.1, 0.3) / 0.3;
      audioIconElementStyle.opacity = audioIconOpacity as any;
    } else {
      audioIconElementStyle.opacity = 1 as any;
    }

    if (percentage > 0.5) {
      let wordBriefOpacity = Math.min(percentage - 0.5, 0.32) / 0.32;

      briefElementStyle.opacity = wordBriefOpacity as any;
    } else {
      briefElementStyle.opacity = 0 as any;
    }

    if (diffX <= 0) {
      let labelInnerWrapperOffset =
        Math.min(
          Math.max(diffY - scrollHeight, 0) / triggerShowDetailHeight,
          1,
        ) * -50;

      if (labelInnerWrapperOffset < -30) {
        labelInnerWrapperOffset = -50;
      }
      labelInnerWrapperElementStyle.transform = `translateY(${labelInnerWrapperOffset}%)`;
    } else {
      labelInnerWrapperElementStyle.transform = `translateY(0%)`;
    }

    if (!isEnd) {
      for (let [, wordCardComponent] of this.wordItemMap) {
        if (wordCardComponent !== targetWordCardComponent) {
          wordCardComponent.elementStyle.opacity = Math.max(
            1 - percentage,
            0.05,
          ) as any;
        }
      }
    }
  }

  calculateWordCardTopPosition(index: number): string {
    return `${index * WORD_CARD_HEIGHT + index * WORD_CARD_SEPARATE}px`;
  }

  ngAfterViewInit(): void {
    let {wordItemQueryList} = this;

    wordItemQueryList.changes.subscribe(() => this.refreshWordItemMap());
    this.refreshWordItemMap();

    setTimeout(() => (this.enabledWordCardTransitions = true), 100);
  }

  ngOnDestroy(): void {}

  private fetchNextWord(): WordInfo | undefined {
    return Object.assign(
      {},
      simulationData[Math.floor(Math.random() * simulationData.length)],
    );
  }

  private refreshWordItemMap(): void {
    this.wordItemMap.clear();

    for (let item of this.wordItemQueryList.toArray()) {
      this.wordItemMap.set(item.element, item);
    }
  }

  private async slideToggleMarked(event: SlideXDelegateEvent): Promise<void> {
    let {targetWordCardComponent} = this;

    if (!targetWordCardComponent) {
      return;
    }

    this.sliding = true;

    let {diffX} = event.detail;
    let {innerElementStyle, markedHintElementStyle} = targetWordCardComponent;
    let offset = Math.max(diffX, 0);

    update(offset);

    if (event.detail.touch.isEnd && offset > 0) {
      let momentumInfo = momentum(
        offset,
        0,
        WORD_CARD_WIDTH,
        Date.now() - this.slidXStartTime,
      );
      let newOffset = momentumInfo.destination ? 0 : WORD_CARD_WIDTH;

      await animate(
        offset,
        newOffset,
        Math.min(momentumInfo.duration, 200),
        Easing.circular,
        update,
      );

      if (!newOffset) {
        return;
      }

      let words: WordInfo[] = this.words$.value.slice();
      let newWord = this.fetchNextWord();

      if (newWord) {
        words.splice(words.indexOf(targetWordCardComponent.word), 1, newWord);
      } else {
        words.splice(words.indexOf(targetWordCardComponent.word), 1);
      }

      this.words$.next(words);
    }

    function update(offset: number) {
      let percentage = offset / WORD_CARD_WIDTH;
      innerElementStyle.transform = `translate(${offset}px, 0)`;
      innerElementStyle.opacity = (1 - percentage) as any;
      if (percentage > 0.25) {
        let offsetX = Math.min(percentage - 0.25, 0.75) / 0.75 * 0.75 * 100;
        markedHintElementStyle.transform = `translateX(${offsetX}%)`;
      } else {
        markedHintElementStyle.transform = 'translateX(0%)';
      }

      if (percentage > 0.8) {
        markedHintElementStyle.opacity = (1 -
          Math.min(percentage - 0.8, 0.2) / 0.2) as any;
      } else if (percentage > 0.1) {
        markedHintElementStyle.opacity = (Math.min(percentage - 0.1, 0.32) /
          0.32) as any;
      } else {
        markedHintElementStyle.opacity = 0 as any;
      }
    }
  }

  private showWordDetail(word: WordInfo): void {
    this.activeWord$.next(word);
  }
}
