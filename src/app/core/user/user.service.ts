import {Injectable, OnDestroy} from '@angular/core';

import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import {LoadingService} from 'app/ui';

import {STUDY_ACTIVE_TIMEOUT} from 'app/constants';
import {APIService} from 'app/core/common';
import {UserConfigService} from 'app/core/config';
import {AuthConfigService} from 'app/core/config/auth';
import {SyncService} from 'app/core/data';
import {EngineService} from 'app/core/engine';

@Injectable()
export class UserService implements OnDestroy {
  readonly studyHeartBeat$ = new Subject<void>();

  readonly studiedCollectionFinishedMap$: ReplaySubject<Map<string, boolean>>;

  private subscription = new Subscription();

  constructor(
    private userConfigService: UserConfigService,
    private syncService: SyncService,
    private apiService: APIService,
    private loadingService: LoadingService,
    private authConfigService: AuthConfigService,
    private engineService: EngineService,
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

          let studyTimeID = await this.engineService.studyTimeID$
            .first()
            .toPromise();

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

  async resetStorage(): Promise<void> {
    await Promise.all([
      this.syncService.reset(),
      this.authConfigService.reset(),
    ]);
  }

  async signOut(): Promise<void> {
    this.loadingService.show('注销中...');

    let [account] = await Promise.all([
      this.authConfigService.account$.first().toPromise(),
      this.resetStorage(),
      this.apiService.signOut(),
    ]);

    await this.authConfigService.set('account', account);

    this.loadingService.show('退出登录!');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }
}
