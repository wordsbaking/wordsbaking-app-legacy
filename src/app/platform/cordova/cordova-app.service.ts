import {Injectable, NgZone} from '@angular/core';

import * as logger from 'logger';

import {environment} from 'environments/environment';

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
    let Keyboard = window.Keyboard!;

    Keyboard.shrinkView(false);

    document.addEventListener(
      'backbutton',
      this.handleBackButtonPress.bind(this),
      false,
    );

    if (environment.debug) {
      this.loadEruda().catch(logger.error);
    }
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

    if (this.androidBackButtonBlockers.length) {
      while (true) {
        let blocker = this.androidBackButtonBlockers.shift();

        // tslint:disable-next-line:no-boolean-literal-compare
        if (blocker && blocker() !== false) {
          this.zone.run(() => undefined);
          return;
        } else {
          break;
        }
      }
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

  private loadEruda(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let loader = document.createElement('SCRIPT');

      loader.onload = () => {
        (window as any).eruda.init();
        resolve();
        reset();
      };

      loader.onerror = () => {
        reject();
        reset();
      };

      loader.setAttribute('defer', 'defer');
      loader.setAttribute('async', 'async');
      loader.setAttribute('src', 'http://cdn.jsdelivr.net/npm/eruda');

      document.getElementsByTagName('head')[0].appendChild(loader);

      function reset() {
        loader.onload = undefined as any;
        loader.onerror = undefined as any;
      }
    });
  }
}
