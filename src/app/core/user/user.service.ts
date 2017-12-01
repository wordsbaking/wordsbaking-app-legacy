import {Injectable, OnDestroy} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import * as moment from 'moment';
import * as ms from 'ms';

import {LoadingService} from 'app/ui';

import {APIService} from 'app/core/common';
import {UserConfigService} from 'app/core/config';
import {SyncService} from 'app/core/data';

const DAY_START_CLOCK = 4; // A new day start at 4 AM.
const STUDY_ACTIVE_TIMEOUT = ms('30s');

@Injectable()
export class UserService implements OnDestroy {
  readonly studyHeartBeat$ = new Subject<void>();

  private oneMinInterval$ = Observable.interval(ms('1m'))
    .startWith(0)
    .publishReplay(1)
    .refCount();

  private studyTimeID$ = this.oneMinInterval$
    .map(() => `study-time-${moment().format('YYYYMMDD')}`)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  private studyStatsID$ = this.oneMinInterval$
    .map(() => `study-stats-${moment().format('YYYYMMDD')}`)
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
          .hour(-DAY_START_CLOCK)
          .startOf('day')
          .hour(DAY_START_CLOCK)
          .valueOf() as TimeNumber,
    )
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly studiedCollectionFinishedMap$: ReplaySubject<Map<string, boolean>>;

  private subscription = new Subscription();

  constructor(
    private userConfigService: UserConfigService,
    private syncService: SyncService,
    private apiService: APIService,
    private loadingService: LoadingService,
  ) {
    this.subscription.add(
      this.studyHeartBeat$
        .switchMap(() => this.userConfigService.lastActiveAt$.first())
        .switchMap(async lastActiveAt => {
          let now = Date.now();
          let duration = Math.max(
            Math.min(
              Math.floor((now - lastActiveAt) / 1000),
              STUDY_ACTIVE_TIMEOUT,
            ),
            0,
          );

          let syncService = this.syncService;

          await syncService.update(syncService.user, 'lastActiveAt', now);

          let studyTimeID = await this.studyStatsID$.first().toPromise();

          await syncService.accumulate(
            syncService.statistics,
            studyTimeID,
            duration,
          );
        })
        .subscribe(),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  triggerStudyHeartBeat() {
    this.studyHeartBeat$.next();
  }

  async signOut(): Promise<void> {
    await this.loadingService.wait(this.apiService.signOut(), '注销中...');
    await this.syncService.reset();
    setTimeout(() => (window.location.href = '/sign-in'), 200);
  }
}
