import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as v from 'villa';

import {EngineService, WordInfo} from 'app/core/engine';

const MAX_WORD_ITEM_COUNT = 4;

@Injectable()
export class WordStackService {
  readonly words$ = new BehaviorSubject<(WordInfo | undefined)[]>([]);

  private fetchedWords = false;

  private recentFetchedWord$ = new BehaviorSubject<WordInfo | undefined>(
    undefined,
  );
  private recentRemovedWord: WordInfo | undefined;
  private recentRemovedWordIndex: number | undefined;
  private pendingWord: WordInfo | undefined;

  private fillWordLock = {};

  constructor(private engineService: EngineService) {}

  add(word: WordInfo) {
    let words = this.words$.value.slice();

    if (words.length >= MAX_WORD_ITEM_COUNT) {
      words.shift();
    }

    words.push(word);

    this.words$.next(words);
  }

  remove(word: WordInfo, trash: boolean, hold?: boolean): boolean {
    let words = this.words$.value;

    for (let i = 0, l = words.length; i < l; i++) {
      let item = words[i];

      if (item && item.term === word.term) {
        return this.removeByIndex(i, trash, hold);
      }
    }

    return false;
  }

  removeByIndex(index: number, trash: boolean, hold = true): boolean {
    if (!this.get(index)) {
      return false;
    }

    let words = this.words$.value.slice();
    let word = words[index]!;

    if (hold) {
      words.splice(index, 1, undefined);
    } else {
      words.splice(index, 1);
    }

    if (trash) {
      this.recentRemovedWord = word;
      this.recentRemovedWordIndex = index;
    }

    this.words$.next(words);

    return true;
  }

  async restoreRecentRemovedWord(): Promise<void> {
    let {recentRemovedWord, recentRemovedWordIndex} = this;

    if (!recentRemovedWord || recentRemovedWordIndex === undefined) {
      return;
    }

    let recentFetchedWord = await this.recentFetchedWord$.first().toPromise();

    this.recentRemovedWord = undefined;
    this.recentRemovedWordIndex = undefined;

    if (!recentFetchedWord) {
      return;
    }

    let words = this.words$.value.slice();
    let recentFetchedWordIndex = words.indexOf(recentFetchedWord);

    if (recentFetchedWordIndex !== recentRemovedWordIndex) {
      return;
    }

    this.pendingWord = recentFetchedWord;

    words[recentRemovedWordIndex] = recentRemovedWord;

    this.words$.next(words);

    await this.engineService.restore(recentFetchedWord.term);
  }

  fill(): Promise<void> {
    return v.lock(this.fillWordLock, async () => {
      let words = this.words$.value;
      let newWords = Array(MAX_WORD_ITEM_COUNT);
      let fetchedWords = this.fetchedWords;

      this.fetchedWords = true;

      // tslint:disable-next-lin
      for (let i = 0; i < MAX_WORD_ITEM_COUNT; i++) {
        let word = words[i];

        if (word) {
          newWords[i] = word;

          continue;
        }

        let newWord = this.pendingWord;

        this.pendingWord = undefined;

        if (!newWord) {
          newWord = (await this.engineService.fetch(1, !fetchedWords))[0];
        }

        fetchedWords = true;

        if (!newWord) {
          break;
        }

        newWords[i] = newWord;

        this.recentFetchedWord$.next(newWord);
      }

      this.words$.next(newWords);

      this.clean();
    });
  }

  empty(): void {
    this.words$.next([]);
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
