import {Injectable, NgZone} from '@angular/core';

import {AppService, RoutingService} from '../common';

import {LoadingService, PopupService, ToastService} from 'app/ui';

@Injectable()
export class CordovaAppService extends AppService {
  private latestPreventBackButtonTime: number;

  constructor(
    private toastService: ToastService,
    private loadingService: LoadingService,
    private popupService: PopupService,
    private routingService: RoutingService,
    private zone: NgZone,
  ) {
    super();
  }

  init(): void {
    document.addEventListener(
      'backbutton',
      this.handleBackButtonPress.bind(this),
      false,
    );
  }

  private handleBackButtonPress(event: Event): void {
    let routeConfigurationData = this.routingService.routeConfigurationData$
      .value;
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
