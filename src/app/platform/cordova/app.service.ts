import {Injectable, NgZone} from '@angular/core';

import {AppService} from '../common';

import {LoadingService, PopupService, ToastService} from 'app/ui';

@Injectable()
export class CordovaAppService extends AppService {
  private routeConfigurationData: RouteConfigurationData | undefined;
  private latestPreventBackButtonTime: number;

  constructor(
    private toastService: ToastService,
    private loadingService: LoadingService,
    private popupService: PopupService,
    private zone: NgZone,
  ) {
    super();

    document.addEventListener(
      'backbutton',
      this.handleBackButtonPress.bind(this),
      false,
    );
  }

  init(): void {}

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
