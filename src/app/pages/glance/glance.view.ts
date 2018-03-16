import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit, ViewChild} from '@angular/core';

import * as v from 'villa';

import {Observable} from 'rxjs/Observable';

import {SettingsConfigService, UserConfigService} from 'app/core/config';
import {SyncItem, SyncService} from 'app/core/data';
import {EngineService, StudyStats} from 'app/core/engine';
import {NavigationService} from 'app/core/navigation';
import {pageTransitions} from 'app/core/ui';
import {ToastService} from 'app/ui';
import {fadeTransitions} from 'app/ui/common';
import {generateStudyStatsID} from 'app/util/helpers';

import {RoutingService} from 'app/platform/common';

import {ONE_DAY_MILLISECONDS, RECENT_DAYS_LIMIT} from 'app/constants';
import {
  CollectionSelectorComponent,
  DailyStudyInfo,
  RecentStudyInfo,
} from './components';

const glanceViewTransitions = trigger('glanceViewTransitions', [
  ...pageTransitions,
]);

type StatisticsItemMap = Map<string, SyncItem<StudyStats>>;

@Component({
  selector: 'wb-view.glance-view',
  templateUrl: './glance.view.html',
  styleUrls: ['./glance.view.less'],
  animations: [glanceViewTransitions, fadeTransitions],
})
export class GlanceView implements OnInit {
  @ViewChild('collectionSelector')
  collectionSelector: CollectionSelectorComponent;

  @HostBinding('@glanceViewTransitions')
  get glanceViewTransitions(): string {
    return this.routingService.histories.length > 1 ? 'all' : 'no-enter';
  }

  stats$ = this.engineService.stats$;

  private dailyStudyPlanAndStats$ = this.settingsConfigService.dailyStudyPlan$
    .combineLatest(this.stats$)
    .publishReplay(1)
    .refCount();

  todayNewGoal$ = this.settingsConfigService.dailyStudyPlan$
    .map(plan => plan || undefined)
    .publishReplay(1)
    .refCount();

  // Overall progress

  overallProgressPercentage$ = this.stats$
    .map(
      ({collectionStudied, collectionTotal}) =>
        collectionStudied / (collectionTotal || 1) * 100,
    )
    .publishReplay(1)
    .refCount();

  overallProgressPendingPercentage$ = this.stats$
    .map(
      ({collectionStudied, collectionFamiliar}) =>
        (1 - collectionFamiliar / (collectionStudied || 1)) * 100,
    )
    .publishReplay(1)
    .refCount();

  // Today progress

  private todayDone$ = this.dailyStudyPlanAndStats$
    .map(
      ([plan, {todayNew, todayReviewed}]) =>
        Math.min(todayNew, plan) + todayReviewed,
    )
    .publishReplay(1)
    .refCount();

  private todayGoal$ = this.dailyStudyPlanAndStats$
    .map(([plan, {todayReviewGoal}]) => plan + todayReviewGoal)
    .publishReplay(1)
    .refCount();

  todayProgressPercentage$ = this.todayDone$
    .combineLatest(this.todayGoal$)
    .map(([done, goal]) => done / (goal || 1) * 100)
    .publishReplay(1)
    .refCount();

  todayProgressPendingPercentage$ = Observable.combineLatest(
    this.todayDone$,
    this.settingsConfigService.dailyStudyPlan$,
    this.stats$,
  )
    .map(([done, plan, {todayNew, todayNewUnknown}]) => {
      let exceeds = Math.max(todayNew - plan, 0);
      return Math.max(todayNewUnknown - exceeds, 0) / (done || 1) * 100;
    })
    .publishReplay(1)
    .refCount();

  todayStudyTimeInMinutes$ = this.engineService.todayStudyTime$
    .map(time => Math.round(time / 60).toString())
    .startWith('-')
    .publishReplay(1)
    .refCount();

  recentStudyInfo$ = this.syncService.statistics.itemMap$
    .combineLatest(this.settingsConfigService.dailyStudyPlan$)
    .map<
      [StatisticsItemMap, number],
      RecentStudyInfo
    >(([map, dailyStudyPlan]) => {
      let lastRecentDate = new Date();

      lastRecentDate.setHours(0);
      lastRecentDate.setMinutes(0);
      lastRecentDate.setSeconds(0);
      lastRecentDate.setMilliseconds(0);

      let dailyNewSum = 0;
      let dailyTotalMax = dailyStudyPlan;
      let hasDailyData = false;
      let dailyStudyInfos: DailyStudyInfo[] = [];

      for (let offset = RECENT_DAYS_LIMIT - 1; offset >= 0; offset--) {
        let date = new Date(
          lastRecentDate.getTime() - offset * ONE_DAY_MILLISECONDS,
        );
        let studyStatsId = generateStudyStatsID(date);
        let studyStatsSyncItem = map.get(studyStatsId);

        if (studyStatsSyncItem && studyStatsSyncItem.data) {
          let studyStats = studyStatsSyncItem.data;

          hasDailyData = true;
          dailyNewSum += studyStats.todayNew;

          let total = studyStats.todayNew + studyStats.todayReviewed;

          if (total > dailyTotalMax) {
            dailyTotalMax = total;
          }

          dailyStudyInfos.push({
            none: false,
            total,
            date,
          });
        } else {
          dailyStudyInfos.push({
            none: true,
            total: 0,
            date,
          });
        }
      }

      return {
        dailyStudyInfos,
        dailyTotalMax,
        averageDaily: Math.round(dailyNewSum / RECENT_DAYS_LIMIT),
      };
    })
    .publishReplay(1)
    .refCount();

  constructor(
    public syncService: SyncService,
    public userConfigService: UserConfigService,
    private engineService: EngineService,
    private settingsConfigService: SettingsConfigService,
    private toastService: ToastService,
    private navigationService: NavigationService,
    private routingService: RoutingService,
  ) {}

  async ngOnInit(): Promise<void> {
    // 为了保证页面切入动画流畅, 同步任务拍后处理
    await v.sleep(1100);
    await this.syncService.sync();
  }

  async startStudy(): Promise<void> {
    let collectionIdSet = await this.settingsConfigService.collectionIDSet$
      .first()
      .toPromise();

    if (collectionIdSet.size === 0) {
      await this.collectionSelector.showPopup();
    }

    collectionIdSet = await this.settingsConfigService.collectionIDSet$
      .first()
      .toPromise();

    if (collectionIdSet.size === 0) {
      this.toastService.show('请选择需要学习的词库!');
      return;
    }

    await this.navigationService.navigate(['/study']);
  }
}
