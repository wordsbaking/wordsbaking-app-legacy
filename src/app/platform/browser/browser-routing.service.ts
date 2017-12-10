import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

import {LoadingService, ToastService} from 'app/ui';

import {RoutingService} from '../common';

@Injectable()
export class BrowserRoutingService extends RoutingService {
  hidSplashScreen = false;

  constructor(
    router: Router,
    loadingService: LoadingService,
    toastService: ToastService,
  ) {
    super(router, loadingService, toastService);
  }

  onNavigationEnd(): void {
    let {routeConfigurationData} = this;

    let pageName = routeConfigurationData && routeConfigurationData.name;

    if (!pageName || pageName === 'splash-screen') {
      document.body.classList.add('hide-splash-screen');
      this.hidSplashScreen = true;
    } else {
      if (!this.hidSplashScreen) {
        this.hidSplashScreen = true;
        setTimeout(
          () => document.body.classList.add('hide-splash-screen'),
          400,
        );
      }
    }
  }
}
