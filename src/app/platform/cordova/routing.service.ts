import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

import {LoadingService, ToastService} from 'app/ui';

import {RoutingService} from '../common';

@Injectable()
export class CordovaRoutingService extends RoutingService {
  hidStatusBar = false;
  hidSplashScreen = false;

  constructor(
    router: Router,
    loadingService: LoadingService,
    toastService: ToastService,
  ) {
    super(router, loadingService, toastService);
    document.body.classList.add('hide-splash-screen');
  }

  onNavigationEnd(): void {
    let {routeConfigurationData} = this;

    let pageName = routeConfigurationData && routeConfigurationData.name;
    let hideStatusBar =
      routeConfigurationData && routeConfigurationData.hideStatusBar;

    if (!pageName || pageName === 'splash-screen') {
      this.hidSplashScreen = true;
    } else {
      if (!this.hidSplashScreen) {
        this.hidSplashScreen = true;
        setTimeout(() => navigator.splashscreen!.hide(), 400);
      }
    }

    if (hideStatusBar !== this.hidStatusBar) {
      if (hideStatusBar) {
        window.StatusBar!.hide();
        this.hidStatusBar = true;
      } else if (!hideStatusBar) {
        window.StatusBar!.show();
        this.hidStatusBar = false;
      }
    }
  }
}
