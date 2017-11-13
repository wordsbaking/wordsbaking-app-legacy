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
  QueryList,
  ViewChildren,
} from '@angular/core';

import * as $ from 'jquery';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {WordInfo} from 'app/core/engine';

import {
  PolylineDelegateEvent,
  SlideXDelegateEvent,
  TouchDelegate,
  TouchIdentifier,
  TouchStartDelegateEvent,
} from 'app/lib/touch-delegate';

import {Easing, animate, momentum} from 'app/lib/animate';

import {WordItemComponent} from '../word-item/word-item.component';

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
    obstinate: true,
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
    obstinate: true,
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
    obstinate: false,
    needRemoveConfirm: false,
  },
];

const WORD_ITEM_HEIGHT = 60;
const WORD_ITEM_WIDTH = 280;

@Component({
  selector: 'wb-study-view-word-stack',
  templateUrl: './word-stack.component.html',
  styleUrls: ['./word-stack.component.less'],
  animations: [
    trigger('wordItemTransitions', [
      transition('void => true', [
        style({opacity: 0, transform: 'translateX(0)'}),
        angularAnimate(
          '0.2s linear',
          style({opacity: 1, transform: 'translateX(0)'}),
        ),
      ]),
      transition('true => void', [
        angularAnimate('0.2s ease-out', style({opacity: 0})),
      ]),
    ]),
  ],
})
export class WordStackComponent implements AfterViewInit {
  @ViewChildren(WordItemComponent)
  wordItemQueryList: QueryList<WordItemComponent>;

  words$ = new BehaviorSubject<WordInfo[]>([]);

  element: HTMLElement;

  enabledWordItemTransitions = false;

  private touchDelegate: TouchDelegate;
  private wordItemMap = new Map<HTMLElement, WordItemComponent>();
  private targetWordItemComponent: WordItemComponent | undefined;
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
    this.words$.next(simulationData.slice());
  }

  @HostBinding('style.height')
  get height(): string {
    return `${this.words$.value.length * WORD_ITEM_HEIGHT}px`;
  }

  @HostListener('td-touch-start', ['$event'])
  onTouchStart(event: TouchStartDelegateEvent): void {
    if (this.locked) {
      return;
    }

    let $target = $(event.detail.target);
    let $wordItemElement = $target.closest('wb-study-view-word-item');

    this.targetWordItemComponent = this.wordItemMap.get($wordItemElement[0]);
    this.locked = true;
  }

  @HostListener('td-touch-end')
  onTouchEnd(): void {
    if (!this.sliding) {
      this.targetWordItemComponent = undefined;
      this.locked = false;
      this.slidXStartTime = 0;
    }
  }

  @HostListener('td-slide-x', ['$event'])
  async onSlideX(event: SlideXDelegateEvent): Promise<void> {
    let {diffX} = event.detail;

    if (!this.slidXStartTime) {
      this.slidXStartTime = Date.now();
    }

    if (diffX > 0) {
      this.slideToggleMarked(event).catch(() => undefined);
    }

    if (event.detail.touch.isEnd) {
      this.locked = false;
      this.sliding = false;
      this.targetWordItemComponent = undefined;
      this.slidXStartTime = 0;
    }
  }

  @HostListener('td-polyline-after-slide-y', ['$event'])
  onSlideY(event: PolylineDelegateEvent): void {
    let {targetWordItemComponent} = this;

    if (!targetWordItemComponent) {
      return;
    }

    this.sliding = true;

    let {wordBriefElement, wordBriefElementStyle} = targetWordItemComponent;

    if (event.detail.touch.isEnd) {
      if (event.detail.changedAxis === 'x') {
        this.onSlideX(event as any).catch(() => undefined);
      }

      targetWordItemComponent.setInactive();
      wordBriefElementStyle.height = 0 as any;
      wordBriefElementStyle.opacity = 0 as any;
      this.locked = false;
      this.sliding = false;
      this.targetWordItemComponent = undefined;

      for (let [, wordItemComponent] of this.wordItemMap) {
        wordItemComponent.elementStyle.opacity = 1 as any;
      }
      return;
    }

    if (event.detail.changedAxis === 'x') {
      this.onSlideX(event as any).catch(() => undefined);
      return;
    }

    let {diffY} = event.detail;
    let scrollHeight = wordBriefElement.scrollHeight;
    let height = Math.max(diffY, 0);
    let percentage = height / scrollHeight;

    wordBriefElementStyle.height = `${Math.min(scrollHeight, height)}px`;

    if (!targetWordItemComponent.active && percentage > 0.2) {
      targetWordItemComponent.setActive();
    }

    if (percentage > 0.5) {
      wordBriefElementStyle.opacity = (Math.min(percentage - 0.5, 0.32) /
        0.32) as any;
    } else {
      wordBriefElementStyle.opacity = 0 as any;
    }

    if (!event.detail.touch.isEnd) {
      for (let [, wordItemComponent] of this.wordItemMap) {
        if (wordItemComponent !== targetWordItemComponent) {
          wordItemComponent.elementStyle.opacity = Math.max(
            1 - percentage,
            0.1,
          ) as any;
        }
      }
    }
  }

  calculateWordItemTopPosition(index: number): string {
    return `${index * WORD_ITEM_HEIGHT}px`;
  }

  ngAfterViewInit(): void {
    let {wordItemQueryList} = this;

    wordItemQueryList.changes.subscribe(() => this.refreshWordItemMap());
    this.refreshWordItemMap();

    setTimeout(() => (this.enabledWordItemTransitions = true), 100);
  }

  fetchNextWord(): WordInfo {
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
    let {targetWordItemComponent} = this;

    if (!targetWordItemComponent) {
      return;
    }

    this.sliding = true;

    let {diffX} = event.detail;
    let {innerElementStyle, markedHintElementStyle} = targetWordItemComponent;
    let offset = Math.max(diffX, 0);

    update(offset);

    if (event.detail.touch.isEnd && offset > 0) {
      let momentumInfo = momentum(
        offset,
        0,
        WORD_ITEM_WIDTH,
        Date.now() - this.slidXStartTime,
      );
      let newOffset = momentumInfo.destination ? 0 : WORD_ITEM_WIDTH;

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

      words.splice(words.indexOf(targetWordItemComponent.word), 1, newWord);

      this.words$.next(words);
    }

    function update(offset: number) {
      let percentage = offset / WORD_ITEM_WIDTH;
      innerElementStyle.transform = `translate(${offset}px, 0)`;
      innerElementStyle.opacity = (1 - percentage) as any;
      if (percentage > 0.2) {
        let offsetX = Math.min(percentage - 0.2, 0.8) / 0.8 * 0.8 * 100;
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
}

// help
