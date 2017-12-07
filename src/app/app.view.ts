import {
  Component,
  HostBinding,
  NgZone,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import {RouterOutlet} from '@angular/router';

import {
  LoadingService,
  PopupService,
  ToastService,
  ViewContainerService,
} from 'app/ui';

import {SyncService} from 'app/core/data';
import {RoutingService} from 'app/platform/common';

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

  private routeConfigurationData: RouteConfigurationData | undefined;
  private latestPreventBackButtonTime: number;

  constructor(
    viewContainerRef: ViewContainerRef,
    viewContainerService: ViewContainerService,
    syncService: SyncService,
    routingService: RoutingService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private popupService: PopupService,
    private zone: NgZone,
  ) {
    viewContainerService.viewContainerRef = viewContainerRef;

    syncService.lastSyncError$
      .filter(err => !!err)
      .subscribe(() => toastService.show('同步失败'));

    routingService.init();

    if (window.cordova) {
      document.addEventListener(
        'backbutton',
        this.handleBackButtonPress.bind(this),
        false,
      );
    }
  }

  private handleBackButtonPress(event: Event): void {
    let {routeConfigurationData} = this;
    let preventBackHistory =
      routeConfigurationData && routeConfigurationData.preventBackHistory;
    let cordova = window.cordova!;
    let app = navigator.app!;

    if (cordova.platformId !== 'android') {
      return;
    }

    event.preventDefault();

    if (this.popupService.active) {
      this.popupService.clearAll();
      return;
    }

    if (this.loadingService.hasFullScreenLoading) {
      this.loadingService.clearFullScreenLoading();
      return;
    }

    if (preventBackHistory) {
      if (Date.now() - this.latestPreventBackButtonTime <= 3000) {
        app.exitApp();
      } else {
        this.zone.run(() => this.toastService.show('再按一次退出!'));
      }

      this.latestPreventBackButtonTime = Date.now();
    } else {
      app.backHistory();
    }
  }
}
