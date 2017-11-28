import {trigger} from '@angular/animations';
import {Component, HostBinding, OnInit} from '@angular/core';

import {SyncService} from 'app/core/data';
import {EngineService} from 'app/core/engine';
import {pageTransitions} from 'app/core/ui';
import {UserService} from 'app/core/user';

import * as logger from 'logger';

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

  todayStudyTimeInMinutes$ = this.userService.todayStudyTime$
    .map(time => Math.round(time / 60 / 1000).toString())
    .startWith('-');

  constructor(
    private engineService: EngineService,
    private userService: UserService,
    private syncService: SyncService,
  ) {}

  ngOnInit() {
    this.syncService.sync().catch(logger.error);
  }
}
