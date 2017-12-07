import {
  Component,
  HostBinding,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import {RouterOutlet} from '@angular/router';

import {ToastService, ViewContainerService} from 'app/ui';

import {SyncService} from 'app/core/data';
import {AppService, RoutingService} from 'app/platform/common';

import {routerTransitions} from './app-router.animations';

@Component({
  selector: 'wb-root',
  templateUrl: './app.view.html',
  styleUrls: ['./app.view.less'],
  animations: [routerTransitions],
})
export class AppView {
  @ViewChild('outlet', {read: RouterOutlet})
  outlet: RouterOutlet;

  @HostBinding('@routerTransitions')
  get routerTransitionsState(): string {
    return this.outlet.activatedRouteData.name;
  }

  constructor(
    viewContainerRef: ViewContainerRef,
    viewContainerService: ViewContainerService,
    syncService: SyncService,
    routingService: RoutingService,
    appService: AppService,
    toastService: ToastService,
  ) {
    viewContainerService.viewContainerRef = viewContainerRef;

    syncService.lastSyncError$
      .filter(err => !!err)
      .subscribe(() => toastService.show('同步失败'));

    appService.init();
    routingService.init();
  }
}
