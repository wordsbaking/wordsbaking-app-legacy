import {
  Component,
  ElementRef,
  HostBinding,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {WordInfo} from 'app/core/engine';

import {
  WORD_CARD_HEIGHT,
  WORD_CARD_SEPARATE,
  WordCardComponentBase,
} from '../common/word-card-component-base';

import {WordCardComponent} from '../word-card/word-card.component';
import {WordDetailCardComponent} from '../word-detail-card/word-detail-card.component';

import {wordCardTransitions} from './word-stack.animations';

import {simulationData} from './simulation-data';

@Component({
  selector: 'wb-study-view-word-stack',
  templateUrl: './word-stack.component.html',
  styleUrls: ['./word-stack.component.less'],
  animations: [wordCardTransitions],
})
export class WordStackComponent {
  @ViewChild(WordDetailCardComponent)
  wordDetailCardComponent: WordDetailCardComponent;

  words$ = new BehaviorSubject<(WordInfo | undefined)[]>([]);

  element: HTMLElement;

  @HostBinding('@wordCardTransitions') enabledWordCardTransitions = false;

  activeWord$ = new BehaviorSubject<WordInfo | undefined>(undefined);

  @ViewChildren(WordCardComponent)
  private wordCardComponentQueryList: QueryList<WordCardComponent>;

  constructor(ref: ElementRef) {
    this.element = ref.nativeElement;

    // simulate
    setTimeout(
      () =>
        this.words$.next(simulationData.slice(0, 4).map(data => ({...data}))),
      1000,
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

  add(...newWords: WordInfo[]): void {
    let words = this.words$.value.slice();
    let n = 0;

    for (let newWord of newWords) {
      for (let i = n; i < words.length; i++) {
        if (!words[i]) {
          words[i] = newWord;
          n++;
          continue;
        }
      }

      words.push(newWord);
    }

    this.words$.next(words);
  }

  remove(word: WordInfo, hold = true): boolean {
    let words = this.words$.value;
    return this.removeByIndex(words.indexOf(word), hold);
  }

  removeByIndex(index: number, hold = true): boolean {
    if (!this.get(index)) {
      return false;
    }

    let words = this.words$.value.slice();

    if (hold) {
      words.splice(index, 1, undefined);
    } else {
      words.splice(index, 1);
    }

    this.words$.next(words);

    return true;
  }

  stuff(): void {
    let words = this.words$.value.slice();

    // tslint:disable-next-line
    for (let i = 0; i < words.length; i++) {
      let word = words[i];

      if (word) {
        continue;
      }

      let newWord = this.fetchWord();

      if (!newWord) {
        break;
      }

      words[i] = newWord;
    }

    this.words$.next(words);

    this.clean();
  }

  clean(): void {
    let words = this.words$.value.slice();
    let n = 0;

    // tslint:disable-next-line
    for (let i = 0; i < words.length; i++) {
      let word = words[i];

      if (word) {
        words[n++] = word;
      }
    }

    words.length = n;

    this.words$.next(words);
  }

  get(index: number): WordInfo | undefined {
    return this.words$.value[index];
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

  private fetchWord(): WordInfo | undefined {
    return {
      ...simulationData[Math.floor(Math.random() * simulationData.length)],
    };
  }
}
