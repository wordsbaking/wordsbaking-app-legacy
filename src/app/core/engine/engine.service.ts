import {Injectable, OnDestroy} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subscription} from 'rxjs/Subscription';

import * as _ from 'lodash';
import * as moment from 'moment';
import * as ms from 'ms';
import * as v from 'villa';

import {DAY_START_CLOCK} from 'app/constants';
import {SettingsConfig, SettingsConfigService} from 'app/core/config';
import {
  CollectionData,
  SyncItem,
  SyncService,
  WordDataDownloadProgressHandler,
  WordDataItem,
  WordDataLoadingStatus,
  WordDataService,
} from 'app/core/data';
import {generateStudyStatsID, generateStudyTimeID} from 'app/util/helpers';

const FETCH_CACHE_SIZE = 24;
const FETCH_NEW_LIMIT = 4;

const SHORT_SPAN_LIMIT = ms('15m');
const MIDDLE_SPAN_LIMIT = ms('6h');
const MIDDLE_LONG_SPAN_LIMIT = ms('3d');
const LONG_SPAN_LIMIT = ms('7d');

const WORDSBOOK_REMOVE_SPAN_LIMIT = ms('30d');

const MAX_REVIEW_GOAL_COEFFICIENT = 8;

const REVIEW_SPAN_LIMITS = [
  SHORT_SPAN_LIMIT,
  MIDDLE_SPAN_LIMIT,
  MIDDLE_LONG_SPAN_LIMIT,
  LONG_SPAN_LIMIT,
  Infinity,
];

// const NEW_WORDS_PRIORITY_REVIEW_FIRST = 3;
const NEW_WORDS_PRIORITY_FINAL = REVIEW_SPAN_LIMITS.length - 1;

// const MAX_STATUS = 10;

const INITIAL_TIME = 0.08;
const INITIAL_TIME_EQUAL_INDEX = 5;

const OBSTINATE_DELAY_LIMIT = 6;
const OBSTINATE_DELAY = 3 * 60;
const OBSTINATE_DELAY_MS = OBSTINATE_DELAY * 60 * 1000;

// const EMPTY_RECORD_R_SPAN = calculateTimeSpan({
//   m: false,
//   r: '',
//   f: 0,
//   l: 0,
// });

const REMOVAL_CONFIRM_NEEDED_STATUSES_REGEX = /^.1*[^1]/;

const STATS_KEYS = Object.keys(
  getSingleStats(undefined),
) as (keyof StudyStats)[];

const RECYCLE_BIN_RECENT_NUMBER = 10;
const RECYCLE_BIN_SPLIT_LIMIT = 20;

export interface StudyStats {
  // todayNewGoal: number;
  todayNew: number;
  todayNewUnknown: number;
  todayReviewGoal: number;
  todayMinimumReviewGoal: number;
  todayReviewed: number;
  todayReviewedUnknown: number;
  collectionTotal: number;
  collectionTodayNew: number;
  collectionStudied: number;
  collectionFamiliar: number;
  wordsbookTotal: number;
  wordsbookTodayNew: number;
  wordsbookFamiliar: number;
}

export const enum StudyScope {
  selected,
  wordsbook,
  other,
}

export const enum StudyOrder {
  random,
  frequencyAscending,
  frequencyDescending,
  letterAscending,
  letterDescending,
}

export const enum SentenceTtsSpeed {
  default = 1,
  slower = 0.85,
  verySlow = 0.7,
}

interface StudyRecord {
  id: string;
  data: StudyRecordData;
}

export interface StudyRecordData {
  /** status string, one char per status */
  r: string;
  /** first shown */
  f: number;
  /** last shown */
  l: number;
  /** marked */
  m?: boolean;
  /** wordsbook */
  w?: boolean;
}

export const enum MemorizingStatus {
  removed = 0,
  known = 1,
  uncertain = 2,
  unknown = 3,
  // ,
  // sKnown = 6,
  // sUncertain = 7,
  // sUnknown = 8
}

export interface CollectionInfo {
  name: string;
  id: string;
}

interface RemovedTermsInfo {
  recent: string[];
  more: string[];
}

interface SubmitData {
  status?: MemorizingStatus;
  wordsbook?: boolean;
  marked?: boolean;
}

export interface WordInfo extends WordDataItem {
  new: boolean;
  marked: boolean;
  obstinate: boolean;
  needRemoveConfirm: boolean;
}

interface CandidateInfo {
  term: string;
  lastShown: number;
  span: number;
  marked: boolean;
  obstinate: boolean;
  needRemoveConfirm: boolean;
}

@Injectable()
export class EngineService implements OnDestroy {
  readonly stats$ = new ReplaySubject<StudyStats>(1);

  readonly load$ = new ReplaySubject<void>(1);

  readonly oneMinInterval$ = Observable.interval(ms('1m'))
    .startWith(0)
    .publishReplay(1)
    .refCount();

  readonly studyTimeID$ = this.oneMinInterval$
    .map(() => generateStudyTimeID())
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly studyStatsID$ = this.oneMinInterval$
    .map(() => generateStudyStatsID())
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly todayStudyTime$ = this.syncService.statistics.itemMap$
    .combineLatest(this.studyTimeID$)
    .map(([map, id]) => {
      let item = map.get(id);

      return item ? item.data as number : 0;
    })
    .publishReplay(1)
    .refCount();

  readonly todayStartAt$ = this.oneMinInterval$
    .map(
      () =>
        moment()
          .subtract(DAY_START_CLOCK, 'hour')
          .startOf('day')
          .add(DAY_START_CLOCK, 'hour')
          .valueOf() as TimeNumber,
    )
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  /** @internal */
  studyScopeSet = new Set<StudyScope>();
  /** @internal */
  todayStartAt: TimeNumber;
  /** @internal */
  todayEndAt: TimeNumber;
  /** @internal */
  collectionTermSet: Set<string>;

  private loadedTerms: string[];

  private newWordsPriority: number;
  private todayNewGoal: number;
  private termWithoutDataIDSet: Set<string>;
  private collectionTermsNumber: number;
  private studyOrder: StudyOrder;

  private candidates: Candidate[];
  private candidateMap: Map<string, Candidate>;

  private fetchedTermSet = new Set<string>();
  private candidatesFetchingCache: Candidate[] = [];
  private fetchLock = {};

  private newWordTerms: string[];

  private subscription = new Subscription();

  constructor(
    private wordDataService: WordDataService,
    private syncService: SyncService,
    settingsConfigService: SettingsConfigService,
  ) {
    this.subscription.add(
      Observable.combineLatest(
        this.todayStartAt$,
        settingsConfigService.collectionIDSet$,
        settingsConfigService.studyScopeSet$,
        settingsConfigService.dailyStudyPlan$,
        settingsConfigService.newWordsPriority$,
        settingsConfigService.studyOrder$,
      )
        .debounceTime(100)
        .distinctUntilChanged(_.isEqual)
        .switchMap(
          (
            [
              todayStartAt,
              collectionIDSet,
              studyScopeSet,
              dailyStudyPlan,
              newWordsPriority,
              studyOrder,
            ],
          ) => {
            return Observable.combineLatest(
              this.syncService.records.itemMap$.first(),
              this.syncService.collections.itemMap$,
            )
              .filter(([, collectionItemMap]) => {
                if (collectionIDSet.size && !collectionItemMap.size) {
                  return false;
                }

                return true;
              })
              .map(([recordItemMap, collectionItemMap]) => [
                todayStartAt,
                {
                  collectionIDSet,
                  studyScopeSet,
                  dailyStudyPlan,
                  newWordsPriority,
                  studyOrder,
                },
                recordItemMap,
                collectionItemMap,
              ]);
          },
        )
        .subscribe(
          ([todayStartAt, settings, recordItemMap, collectionItemMap]) => {
            this.load(
              todayStartAt as TimeNumber,
              settings as Pick<
                SettingsConfig,
                | 'collectionIDSet'
                | 'studyScopeSet'
                | 'dailyStudyPlan'
                | 'newWordsPriority'
                | 'studyOrder'
              >,
              recordItemMap as Map<string, SyncItem<StudyRecordData>>,
              collectionItemMap as Map<string, SyncItem<CollectionData>>,
            );
          },
        ),
    );

    this.subscription.add(
      this.stats$.subscribe(async stats => {
        let studyStatsID = await this.studyStatsID$.first().toPromise();

        await syncService.update(syncService.statistics, studyStatsID, stats);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // private _onworkermessage = (message: MessageEvent) => {
  //   if ((<IWorkerData>message.data).type) {
  //     let invokeData = <IWorkerData>message.data;
  //     let type = invokeData.type;
  //     let args = invokeData.args;

  //     this[type].apply(null, args);
  //   } else {
  //     let callbackData = <IWorkerCallbackData>message.data;
  //     let uid = callbackData.uid;
  //     let ret = callbackData.ret;
  //     let err = callbackData.err;

  //     if (uid) {
  //       let callback = this._callbackMap.get(uid);
  //       callback.call(null, err ? new Error(err) : null, ret);
  //       this._callbackMap.remove(uid);
  //     }
  //   }
  // };

  // get loadStatus(): LoadStatus {
  //     return this._loadStatus;
  // }

  async ensureWordsData(
    progress: WordDataDownloadProgressHandler,
  ): Promise<WordDataLoadingStatus> {
    let loadedTerms = this.loadedTerms;
    let missingIDs = await this.wordDataService.ensure(loadedTerms, progress);

    let loadedRatio = 1 - missingIDs.length / loadedTerms.length;

    return loadedRatio === 1
      ? WordDataLoadingStatus.complete
      : loadedRatio > 0.3
        ? WordDataLoadingStatus.partial
        : loadedRatio > 0
          ? WordDataLoadingStatus.critical
          : WordDataLoadingStatus.none;
  }

  async submit(term: string, data: SubmitData): Promise<StudyStats> {
    let now = Date.now();

    let candidate = this.candidateMap.get(term);
    let candidates = this.candidates;

    if (!candidate) {
      candidate = new Candidate(this, term);
      this.candidateMap.set(term, candidate);
      candidates.unshift(candidate);
      // tslint:disable-next-line:no-console
      console.error('Unexpected undefined candidate.');
    }

    let stats = await this.stats$.first().toPromise();

    let statsBefore = getSingleStats(candidate);
    updateCandidate(candidate);
    let statsAfter = getSingleStats(candidate);

    for (let key of STATS_KEYS) {
      stats[key] += statsAfter[key] - statsBefore[key];
    }

    this.stats$.next(stats);

    if (
      this.candidatesFetchingCache.length >= INITIAL_TIME_EQUAL_INDEX &&
      candidate.span < 1
    ) {
      this.candidatesFetchingCache.splice(
        INITIAL_TIME_EQUAL_INDEX,
        0,
        candidate,
      );
    } else {
      if (
        candidate.inWordsbook &&
        candidate.span >= WORDSBOOK_REMOVE_SPAN_LIMIT
      ) {
        candidate.data.w = false;
      }

      for (let i = 0; i < candidates.length; i++) {
        if (candidate === candidates[i]) {
          candidates.splice(i, 1);
          break;
        }
      }

      let inserted = false;

      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].planTime > candidate.planTime) {
          candidates.splice(i, 0, candidate);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        candidates.push(candidate);
      }
    }

    this.fetchedTermSet.delete(term);

    await this.updateRecord(term, candidate.data);

    return stats;

    function updateCandidate(candidate: Candidate): void {
      if (typeof data.wordsbook === 'boolean') {
        candidate.data.w = data.wordsbook;
      }

      if (typeof data.marked === 'boolean') {
        candidate.data.m = data.marked;
      }

      if (typeof data.status === 'number') {
        candidate.addStatus(data.status, now);
      }

      candidate.update();
    }
  }

  async fetch(count: number, reset = false): Promise<WordInfo[]> {
    return v.lock(this.fetchLock, async () => {
      let candidateInfos = await this._fetch(count, reset);

      let termToCandidateInfo: Map<string, CandidateInfo> = new Map(
        candidateInfos.map<[string, CandidateInfo]>(info => [info.term, info]),
      );

      let terms = Array.from(termToCandidateInfo.keys());

      let dataItems = await this.wordDataService.get(terms);

      return dataItems.map(item => {
        let candidateInfo = termToCandidateInfo.get(item.term)!;

        return {
          ...item,
          new: !candidateInfo.lastShown,
          marked: candidateInfo.marked,
          obstinate: candidateInfo.obstinate,
          needRemoveConfirm: candidateInfo.needRemoveConfirm,
        };
      });
    });
  }

  getRemovedTermsInfo(
    recentNumber = RECYCLE_BIN_RECENT_NUMBER,
    splitLimit = RECYCLE_BIN_SPLIT_LIMIT,
  ): RemovedTermsInfo {
    let terms = this.removedCandidates
      .sort((a, b) => b.lastShown - a.lastShown)
      .map(candidate => candidate.term);

    let recentTerms = terms.splice(
      0,
      terms.length > splitLimit ? recentNumber : Infinity,
    );

    terms.sort(
      (termA, termB) => (termA.toLowerCase() > termB.toLowerCase() ? 1 : -1),
    );

    return {
      recent: recentTerms,
      more: terms,
    };
  }

  async restore(id: string): Promise<void> {
    let candidate = this.candidateMap.get(id);

    if (candidate) {
      candidate.restore();
      await this.updateRecord(id, candidate.data);
    }

    this.reload();
  }

  async restoreAll(): Promise<void> {
    let records = this.removedCandidates.map(candidate => {
      candidate.restore();

      return {
        id: candidate.term,
        data: candidate.data,
      };
    });

    await this.updateRecords(records);

    this.reload();
  }

  private load(
    todayStartAt: TimeNumber,
    {
      collectionIDSet,
      studyScopeSet,
      dailyStudyPlan,
      newWordsPriority,
      studyOrder,
    }: Pick<
      SettingsConfig,
      | 'collectionIDSet'
      | 'studyScopeSet'
      | 'dailyStudyPlan'
      | 'newWordsPriority'
      | 'studyOrder'
    >,
    recordItemMap: Map<string, SyncItem<StudyRecordData>>,
    collectionItemMap: Map<string, SyncItem<CollectionData>>,
  ): void {
    // let [
    //   recordItemMap,
    //   collectionItemMap,
    //   // studiedCollectionFinishedMap,
    //   {
    //     collectionIDSet,
    //     studyScopeSet,
    //     dailyStudyPlan,
    //     newWordsPriority,
    //     studyOrder,
    //   },

    //   this.syncService.records.itemMap$,
    //   this.syncService.collections.itemMap$,
    //   // this.userService.studiedCollectionFinishedMap$,
    //   this.settingsService.settings$,
    // )
    //   .first()
    //   .toPromise();

    // let studiedMapUpdated = false;

    let collections = Array.from(collectionIDSet)
      .map(id => {
        // if (!studiedCollectionFinishedMap.has(id)) {
        //   studiedCollectionFinishedMap.set(id, false);
        //   studiedMapUpdated = true;
        // }

        let item = collectionItemMap.get(id);
        return item && item.data;
      })
      .filter(<T>(object: T | undefined): object is T => !!object);

    // if (studiedMapUpdated) {
    //   this.userService.studiedCollectionFinishedMap$.next(
    //     studiedCollectionFinishedMap,
    //   );
    // }

    let collectionTerms = _.union(
      ...collections.map(collection => collection.terms),
    );

    // let loadStatus: WordDataLoadingStatus;

    this.todayStartAt = todayStartAt;
    // todayStart = argTodayStart;
    this.todayEndAt = moment(todayStartAt)
      .add(1, 'day')
      .valueOf() as TimeNumber;

    this.studyScopeSet = studyScopeSet;

    this.todayNewGoal = dailyStudyPlan;

    this.newWordsPriority = newWordsPriority;

    this.studyOrder = studyOrder;

    let candidates = (this.candidates = [] as Candidate[]);
    let candidateMap = (this.candidateMap = new Map<string, Candidate>());

    this.collectionTermsNumber = collectionTerms.length;

    this.collectionTermSet = new Set<string>(collectionTerms);

    for (let {id, data} of recordItemMap.values()) {
      let candidate = new Candidate(this, id, data);

      candidates.push(candidate);
      candidateMap.set(id, candidate);
    }

    candidates.sort(compareByPlannedTime);

    this.termWithoutDataIDSet = new Set<string>();

    this.loadedTerms = _.union(
      collectionTerms,
      Array.from(recordItemMap.keys()),
    );

    this.initializeNewWordTerms();

    this.loadStats();

    this.load$.next(undefined);

    // fetchedTermHash = {};

    // return this.lock(() => {
    //   return this._invokeWorker<void>(
    //     'load',
    //     recordItemMap,
    //     combinedCollection,
    //     settings.studyScopes,
    //     settings.dailyStudyPlan,
    //     settings.newWordsPriority,
    //     settings.studyOrder,
    //     user.today,
    //   ).then(() => {
    //     this.loadedTerms = allPossibleTerms;
    //     this._loadedSignature = Engine._getLoadSignature();
    //   });
    // });
  }

  private reload(): void {
    this.candidates.sort(compareByPlannedTime);
    this.loadStats();
  }

  private loadStats(): void {
    // let todayNewGoal = 0;
    let stats = getSingleStats(undefined);

    for (let candidate of this.candidates) {
      let singleStats = getSingleStats(candidate);

      for (let key of STATS_KEYS) {
        stats[key] += singleStats[key];
      }
    }

    stats.collectionTotal = this.collectionTermsNumber;
    stats.todayMinimumReviewGoal = Math.min(
      Math.floor(this.todayNewGoal * MAX_REVIEW_GOAL_COEFFICIENT),
      stats.todayReviewGoal,
    );

    this.stats$.next(stats);
  }

  private get removedCandidates(): Candidate[] {
    return this.candidates.filter(candidate => candidate.removed);
  }

  private async _fetch(
    count: number,
    reset: boolean,
    internal = false,
  ): Promise<CandidateInfo[]> {
    let fetchedIDSet = this.fetchedTermSet;
    let candidatesFetchingCache = this.candidatesFetchingCache;

    if (reset) {
      this.initializeNewWordTerms();
      fetchedIDSet.clear();
      candidatesFetchingCache.length = 0;
    }

    if (candidatesFetchingCache.length >= count || internal) {
      return candidatesFetchingCache.splice(0, count).map(candidate => {
        fetchedIDSet.add(candidate.term);
        return candidateToInfo(candidate);
      });
    }

    let newWordTerms = this.newWordTerms;

    let todayNew = await this.stats$
      .map(stats => stats.todayNew)
      .first()
      .toPromise();

    // let goalGap = Math.max(Math.min(stats.collectionTotal - (stats.collectionStudied - stats.todayNew), todayNewGoal) - stats.todayNew, 0);
    let goalGap = Math.max(
      Math.min(newWordTerms.length, this.todayNewGoal - todayNew),
      0,
    );

    let newWordsPriority: number;

    if (goalGap > 0) {
      // haven't accomplished today's goal
      newWordsPriority = this.newWordsPriority;
    } else {
      // goal accomplished
      newWordsPriority = NEW_WORDS_PRIORITY_FINAL;
    }

    // high priority chosen
    let chosenHighPriorityCandidates: Candidate[] = [];
    // let fallback: Candidate[] = [];

    let chosenGroups = [chosenHighPriorityCandidates];

    while (chosenGroups.length < REVIEW_SPAN_LIMITS.length) {
      chosenGroups.push([]);
    }

    let termWithoutDataIDSet = this.termWithoutDataIDSet;

    for (let candidate of this.candidates) {
      let term = candidate.term;

      if (
        fetchedIDSet.has(term) ||
        termWithoutDataIDSet.has(term) ||
        candidate.new ||
        !candidate.inStudyScope
      ) {
        continue;
      }

      let reviewPriority = candidate.reviewPriority;

      if (reviewPriority >= 0) {
        chosenGroups[reviewPriority].push(candidate);

        if (chosenHighPriorityCandidates.length === FETCH_CACHE_SIZE) {
          break;
        }
      }
    }

    let candidates = this.candidates;
    let candidateMap = this.candidateMap;
    let results: Candidate[] = (this.candidatesFetchingCache = []);

    for (let priority = 0; priority < chosenGroups.length; priority++) {
      let chosenCandidates = chosenGroups[priority];

      results.push(
        ...chosenCandidates.slice(0, FETCH_CACHE_SIZE - results.length),
      );

      if (priority === newWordsPriority) {
        let newWordsNumber = Math.min(
          FETCH_CACHE_SIZE - results.length,
          newWordTerms.length,
          FETCH_NEW_LIMIT,
        );

        if (goalGap > 0) {
          // assert index != NEW_WORDS_PRIORITY_FINAL
          if (newWordsNumber >= goalGap) {
            newWordsNumber = goalGap;
            goalGap = 0;
            newWordsPriority = NEW_WORDS_PRIORITY_FINAL;
          } else {
            goalGap -= newWordsNumber;
          }
        }

        let newWordCandidates: Candidate[] = await v.map(
          newWordTerms.splice(0, newWordsNumber),
          async id => {
            let candidate = this.candidateMap.get(id);

            if (!candidate) {
              candidate = new Candidate(this, id);
              candidateMap.set(id, candidate);
              await this.updateRecord(id, candidate.data);
            }

            return candidate;
          },
        );

        candidates.unshift(...newWordCandidates);

        // console.log('added', newWordCandidates.length, 'new words at priority', index);

        results.push(...newWordCandidates);
      }

      if (results.length === FETCH_CACHE_SIZE) {
        break;
      }
    }

    return this._fetch(count, false, true);
  }

  private initializeNewWordTerms(): void {
    let newWordTerms: string[];
    if (this.studyScopeSet.has(StudyScope.selected)) {
      let candidateMap = this.candidateMap;
      newWordTerms = Array.from(this.collectionTermSet).filter(term => {
        let candidate = candidateMap.get(term);
        return !candidate || candidate.new;
      });

      switch (this.studyOrder) {
        case StudyOrder.letterAscending:
          newWordTerms.sort(
            (a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1),
          );
          break;
        case StudyOrder.letterDescending:
          newWordTerms.sort(
            (a, b) => (a.toLowerCase() < b.toLowerCase() ? 1 : -1),
          );
          break;
        case StudyOrder.random:
        default:
          newWordTerms = _.shuffle(newWordTerms);
          break;
      }
    } else {
      newWordTerms = [];
    }

    this.newWordTerms = newWordTerms;
  }

  private async updateRecord(id: string, data: StudyRecordData): Promise<void> {
    let service = this.syncService;
    await service.update(service.records, id, data);
  }

  private async updateRecords(records: StudyRecord[]): Promise<void> {
    let service = this.syncService;

    await v.parallel(records, async ({id, data}) =>
      service.update(service.records, id, data),
    );
  }
}

class Candidate {
  firstShown: number;
  lastShown: number;
  span: number;
  planTime: number;

  constructor(
    private engine: EngineService,
    readonly term: string,
    readonly data: StudyRecordData = {r: '', f: 0, l: 0},
  ) {
    this.update();
  }

  update() {
    let data = this.data;
    this.firstShown = data.f || 0;
    this.lastShown = data.l || 0;
    this.span = calculateTimeSpan(data);
    this.planTime = this.lastShown + this.span;
  }

  addStatus(status: MemorizingStatus, stamp: number) {
    let data = this.data;
    data.r += status.toString();
    data.f = data.f || stamp;
    data.l = stamp;
  }

  restore() {
    let data = this.data;
    data.r = data.r.replace(/0/g, '');
    this.update();
  }

  get new(): boolean {
    return !this.data.r;
  }

  get marked(): boolean {
    return !!this.data.m;
  }

  get removed(): boolean {
    return this.span === Infinity;
  }

  get inStudyScope(): boolean {
    let set = this.engine.studyScopeSet;

    if (set.has(StudyScope.other)) {
      return true;
    }

    if (set.has(StudyScope.selected) && this.inCollection) {
      return true;
    }

    if (set.has(StudyScope.wordsbook) && this.inWordsbook) {
      return true;
    }

    return false;
  }

  get inWordsbook(): boolean {
    return !!this.data.w;
  }

  get inCollection(): boolean {
    return this.engine.collectionTermSet.has(this.term);
  }

  get newToday(): boolean {
    return this.firstShown >= this.engine.todayStartAt;
  }

  /**
   * including item already reviewed
   */
  get needReviewToday(): boolean {
    return (
      !this.newToday &&
      !!this.firstShown &&
      (this.lastShown >= this.engine.todayStartAt ||
        this.planTime < this.engine.todayEndAt)
    );
  }

  get reviewedToday(): boolean {
    return (
      !this.newToday &&
      !!this.firstShown &&
      this.lastShown >= this.engine.todayStartAt
    );
  }

  get familiar(): boolean {
    return this.span >= SHORT_SPAN_LIMIT && this.span !== OBSTINATE_DELAY_MS;
  }

  get unknown(): boolean {
    let r = this.data.r;
    if (!r.length) {
      return true;
    }

    let status: MemorizingStatus = Number(r[r.length - 1]);
    return (
      status !== MemorizingStatus.known && status !== MemorizingStatus.removed
    );
  }

  /**
   * -1 for no need for review
   * 0 for highest
   * 4 for lowest
   */
  get reviewPriority(): number {
    let {todayStartAt, todayEndAt, collectionTermSet} = this.engine;

    let planTime = this.planTime;
    let showedToday = this.lastShown >= todayStartAt;
    let now = Date.now();

    if (planTime >= todayEndAt || (showedToday && planTime > now)) {
      return -1;
    }

    let term = this.term;
    let span = this.span;

    let planExceeded = planTime - now;

    for (let index = 0; index < REVIEW_SPAN_LIMITS.length; index++) {
      let limit = REVIEW_SPAN_LIMITS[index];
      if (span < limit) {
        if (!collectionTermSet.has(term) && !this.inWordsbook) {
          index++;
        }

        if (planExceeded > 0) {
          index -= Math.floor(planExceeded / limit);
        }

        index = Math.min(Math.max(index, 0), REVIEW_SPAN_LIMITS.length - 1);

        return index;
      }
    }

    // it should always return in the for loop above.
    // because the last limit is Infinity.
    return -1;
  }
}

function calculateTimeSpan(record: StudyRecordData): number {
  // TODO
  // let marked = record.m;

  let statuses: MemorizingStatus[] = [];

  for (let statusChar of record.r) {
    let status: MemorizingStatus = Number(statusChar);

    if (status === MemorizingStatus.removed) {
      return Infinity;
    }

    statuses.push(status);
  }

  let span = 0;
  let maxSpan = 0; // max value
  let countSinceMax = 0; // the count of statuses since reaching the max period

  let countSinceUnknown = 0;

  // temp unit: minutes
  // will multiple 60 * 1000 later

  if (!statuses.length) {
    return span;
  }

  let firstStatus = statuses[0];

  let i = 1;

  switch (firstStatus) {
    case MemorizingStatus.known:
      if (
        statuses.length >= 3 &&
        statuses[1] === MemorizingStatus.known &&
        statuses[2] === MemorizingStatus.known
      ) {
        span = 180 * 24 * 60;
        i = 3;
      } else {
        span = 60;
      }
      break;
    case MemorizingStatus.uncertain:
      span = 0.08;
      countSinceUnknown++;
      break;
    case MemorizingStatus.unknown:
      span = 2;
      countSinceUnknown++;
      break;
    default:
      break;
  }

  for (i; i < statuses.length; i++) {
    switch (statuses[i]) {
      case MemorizingStatus.known:
        if (span < 2) {
          span = 2;
        }

        if (countSinceMax) {
          span = Math.max(span, maxSpan / Math.pow(2, countSinceMax - 1));
          maxSpan = 0;
          countSinceMax = 0;
        } else if (span >= 180 * 24 * 60) {
          // 180 days
          // keep the same
        } else if (span >= 40 * 24 * 60) {
          // 30 days
          span *= 1.2;
        } else if (span >= 5 * 24 * 60) {
          // 5 days
          span *= 2;
        } else if (span >= 2 * 24 * 60) {
          // 2 days -> 5 days
          span = 5 * 24 * 60;
        } else if (span >= 6 * 60) {
          // 6 hours -> 2 days
          span = 2 * 24 * 60;
        } else if (span >= 60) {
          // 1 hour -> 6 hours
          span = 60 * 6;
        } else {
          span *= 6;
        }
        break;
      case MemorizingStatus.uncertain:
      case MemorizingStatus.unknown:
        countSinceUnknown++;
        if (
          i === statuses.length - 1 &&
          !(countSinceUnknown % OBSTINATE_DELAY_LIMIT)
        ) {
          span = OBSTINATE_DELAY;
        } else {
          span = INITIAL_TIME;
        }
        break;
    }

    if (i < statuses.length - 1) {
      if (maxSpan < span) {
        maxSpan = span;
        countSinceMax = 0;
      } else {
        countSinceMax++;
      }
    }
  }

  return span * 60 * 1000;
}

function getSingleStats(candidate: Candidate | undefined): StudyStats {
  let todayNew = 0;
  let todayNewUnknown = 0;
  let todayReviewGoal = 0;
  let todayReviewed = 0;
  let todayReviewedUnknown = 0;
  let collectionTodayNew = 0;
  let collectionStudied = 0;
  let collectionFamiliar = 0;
  let wordsbookTotal = 0;
  let wordsbookTodayNew = 0;
  let wordsbookFamiliar = 0;

  if (candidate) {
    if (candidate.firstShown) {
      if (candidate.inWordsbook) {
        wordsbookTotal++;

        if (candidate.familiar) {
          wordsbookFamiliar++;
        }
      }

      if (candidate.inCollection) {
        collectionStudied++;

        if (candidate.familiar) {
          collectionFamiliar++;
        }
      }

      if (candidate.newToday) {
        todayNew++;

        if (candidate.unknown) {
          todayNewUnknown++;
        }

        if (candidate.inCollection) {
          collectionTodayNew++;
        }

        if (candidate.inWordsbook) {
          wordsbookTodayNew++;
        }
      }

      if (candidate.inStudyScope) {
        if (candidate.needReviewToday) {
          todayReviewGoal++;
        }

        if (candidate.reviewedToday) {
          todayReviewed++;

          if (candidate.unknown) {
            todayReviewedUnknown++;
          }
        }
      }
    } else if (candidate.inWordsbook) {
      wordsbookTotal++;
    }
  }

  return {
    todayNew,
    todayNewUnknown,
    todayReviewGoal,
    todayMinimumReviewGoal: 0,
    todayReviewed,
    todayReviewedUnknown,
    collectionTotal: 0,
    collectionTodayNew,
    collectionStudied,
    collectionFamiliar,
    wordsbookTotal,
    wordsbookTodayNew,
    wordsbookFamiliar,
  };
}

function candidateToInfo(candidate: Candidate): CandidateInfo {
  return {
    term: candidate.term,
    lastShown: candidate.lastShown,
    span: candidate.span,
    obstinate: candidate.span === OBSTINATE_DELAY_MS,
    marked: candidate.marked,
    needRemoveConfirm: REMOVAL_CONFIRM_NEEDED_STATUSES_REGEX.test(
      candidate.data.r,
    ),
  };
}

function compareByPlannedTime(a: Candidate, b: Candidate): number {
  return a.planTime - b.planTime;
}

// function compareByLastShownTime(a: Candidate, b: Candidate): number {
//   return a.lastShown - b.lastShown;
// }
