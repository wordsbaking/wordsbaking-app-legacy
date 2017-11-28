import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';

import {SettingsConfigService} from 'app/core/config';
import {SyncService} from 'app/core/data';
import {EngineService} from 'app/core/engine';
import {pageTransitions} from 'app/core/ui';
import {UserService} from 'app/core/user';

import * as logger from 'logger';
import {Observable} from 'rxjs/Observable';

const glanceViewTransitions = trigger('glanceViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.glance-view',
  templateUrl: './glance.view.html',
  styleUrls: ['./glance.view.less'],
  animations: [glanceViewTransitions],
})
export class GlanceView implements OnInit {
  @HostBinding('@glanceViewTransitions') glanceViewTransitions = 'active';

  stats$ = this.engineService.stats$;

  private dailyStudyPlanAndStats$ = this.settingsConfigService.dailyStudyPlan$
    .combineLatest(this.stats$)
    .publishReplay(1)
    .refCount();

  todayNewGoal$ = this.settingsConfigService.dailyStudyPlan$;

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

  todayStudyTimeInMinutes$ = this.userService.todayStudyTime$
    .map(time => Math.round(time / 60 / 1000).toString())
    .startWith('-')
    .publishReplay(1)
    .refCount();

  constructor(
    private engineService: EngineService,
    private userService: UserService,
    private syncService: SyncService,
    private settingsConfigService: SettingsConfigService,
  ) {}

  ngOnInit() {
    this.syncService.sync().catch(logger.error);
  }
}
