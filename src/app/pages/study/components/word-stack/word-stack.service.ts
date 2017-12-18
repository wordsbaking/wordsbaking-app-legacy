import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {EngineService, WordInfo} from 'app/core/engine';

const MAX_WORD_ITEM_COUNT = 4;

@Injectable()
export class WordStackService {
  readonly words$ = new BehaviorSubject<(WordInfo | undefined)[]>([]);

  constructor(private engineService: EngineService) {}

  remove(word: WordInfo, hold?: boolean): boolean {
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

  async stuff(): Promise<void> {
    let words = this.words$.value;
    let newWords = Array(MAX_WORD_ITEM_COUNT);

    // tslint:disable-next-line
    for (let i = 0; i < MAX_WORD_ITEM_COUNT; i++) {
      let word = words[i];

      if (word) {
        newWords[i] = word;
        continue;
      }

      let newWord = (await this.engineService.fetch(1))[0];

      if (!newWord) {
        break;
      }

      newWords[i] = newWord;
    }

    this.words$.next(newWords);

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
}
