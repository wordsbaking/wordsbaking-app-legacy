import {Injectable} from '@angular/core';

import * as _ from 'lodash';
import * as v from 'villa';

import {APIService} from 'app/core/common';
import {DBStorage} from 'app/core/storage';

const WORDS_DATA_DOWNLOAD_LIMIT = 200;

export const enum WordDataLoadingStatus {
  none,
  critical,
  partial,
  complete,
}

export interface WordDataMeaning {
  poss: string[];
  text: string;
}

export interface WordDataSentence {
  s: string;
  t: string;
}

export type PronunciationType = 'us' | 'gb';

export interface WordDataItem {
  term: string;
  prons?: {[pronunciation in PronunciationType]?: string[]};
  briefs: WordDataMeaning[];
  meanings: WordDataMeaning[];
  sentences?: WordDataSentence[];
}

export interface WordDataViewItem {
  term: string;
  phonetics: string | undefined;
  meanings: string[];
  sentence: WordDataSentence | undefined;
}

export type WordDataDownloadProgressHandler = (
  stage: 'downloading' | 'saving',
  percentage: number,
) => void;

@Injectable()
export class WordDataService {
  private inStorageIDSet: Set<string>;
  private storagePromise: Promise<DBStorage<string, WordDataItem>>;

  private downloadLock = {};

  constructor(private apiService: APIService) {
    this.storagePromise = (async () => {
      let storage = await DBStorage.create<string, WordDataItem>({
        name: 'default',
        tableName: 'words-data',
        primaryKey: 'term',
        primaryKeyType: 'text',
      });

      let terms = await storage.getPrimaryKeys();

      this.inStorageIDSet = new Set(terms);

      return storage;
    })();
  }

  /**
   * @return ID of terms missing data.
   */
  async ensure(
    terms: string[],
    progress: WordDataDownloadProgressHandler,
  ): Promise<string[]> {
    await this.storagePromise;

    return v.lock(this.downloadLock, async () => {
      let idSet = new Set(terms);

      for (let term of this.inStorageIDSet) {
        idSet.delete(term);
      }

      terms = Array.from(idSet);

      if (!terms.length) {
        return [];
      }

      try {
        await this.download(terms, progress);
        return [];
      } catch (error) {
        return terms;
      }
    });
  }

  // async getFromStorage(terms: string[]): Promise<WordDataItem[]> {
  //   return this.storage$
  //     .switchMap(storage => {
  //       return v.map(terms, async term => (await storage.get(term))!);
  //     })
  //     .toPromise();
  // }

  async save(item: WordDataItem): Promise<void> {
    let storage = await this.storagePromise;
    await storage.set(item);
    this.inStorageIDSet.add(item.term);
  }

  async get(terms: string[]): Promise<WordDataItem[]> {
    let storage = await this.storagePromise;

    let items = await v.map(terms, term => storage.get(term));

    let termToIndex = new Map<string, number>();

    for (let [index, item] of items.entries()) {
      if (!item) {
        termToIndex.set(terms[index], index);
      }
    }

    if (termToIndex.size) {
      let pendingIDs = Array.from(termToIndex.keys());

      let fetchedItems = await this.download(pendingIDs, () => {});

      for (let item of fetchedItems) {
        let index = termToIndex.get(item.term)!;
        items[index] = item;
      }
    }

    return items as WordDataItem[];
  }

  private async download(
    terms: string[],
    progress: WordDataDownloadProgressHandler,
  ): Promise<WordDataItem[]> {
    let total = terms.length;
    let downloaded = 0;

    progress('downloading', 0);

    let fetchedItems: WordDataItem[] = [];

    for (let chunkedTerms of _.chunk(terms, WORDS_DATA_DOWNLOAD_LIMIT)) {
      let items = await this.apiService.getWordsData(chunkedTerms);

      downloaded += items.length;

      fetchedItems.push(...items);

      progress('downloading', Math.floor(downloaded / total * 100));
    }

    progress('saving', 0);

    let storage = await this.storagePromise;

    await storage.setMultiple(fetchedItems, (done, total) => {
      progress('saving', Math.floor(done / total * 100));
    });

    let inStorageTermSet = this.inStorageIDSet;

    for (let {term} of fetchedItems) {
      inStorageTermSet.add(term);
    }

    return fetchedItems;
  }

  static buildViewItem(
    raw: WordDataItem,
    pronunciation: PronunciationType,
  ): WordDataViewItem {
    let phoneticStrings = raw.prons && raw.prons[pronunciation];

    let phoneticsString: string | undefined;

    if (phoneticStrings && phoneticStrings.length) {
      phoneticsString = phoneticStrings.join(', ');
    }

    let meanings = raw.meanings.map(meaning => {
      let poss = meaning.poss;
      let posStr = poss && poss.length && poss[0] ? `${poss.join('.&')}. ` : '';
      return posStr + meaning.text;
    });

    let sentence = raw.sentences && raw.sentences[0];

    return {
      term: raw.term,
      phonetics: phoneticsString,
      meanings,
      sentence,
    };
  }

  // static speak(term: string, rate = 1) {
  //   if (typeof TTS != 'undefined') {
  //     return new Promise<void>(resolve => {
  //       TTS.speak(
  //         {
  //           text: term,
  //           rate,
  //           locale: settings.ttsLocale,
  //         },
  //         () => resolve(),
  //         () => resolve(),
  //       );
  //     });
  //   }
  // }
}
