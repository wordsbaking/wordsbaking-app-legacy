import {
  Component,
  HostBinding,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  RouteConfigLoadStart,
  Router,
  RouterOutlet,
} from '@angular/router';

import {
  LoadingHandler,
  LoadingService,
  ToastService,
  ViewContainerService,
} from 'app/ui';

import {SyncService} from 'app/core/data';

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
    toastService: ToastService,
    private router: Router,
    private loadingService: LoadingService,
  ) {
    viewContainerService.viewContainerRef = viewContainerRef;

    syncService.lastSyncError$
      .filter(err => !!err)
      .subscribe(() => toastService.show('同步失败'));

    this.mountPageLoadingHint();
  }

  private mountPageLoadingHint(): void {
    let navigationUrl: string | undefined;
    let navigationLoadingHandler: LoadingHandler<void> | undefined;
    let navigationLoadingTimerHandle: number;
    let routeConfigurationData: RouteConfigurationData | undefined;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (
          !routeConfigurationData ||
          routeConfigurationData.name === 'splash-screen'
        ) {
          document.body.classList.add('hide-splash-screen');
        } else {
          document.body.classList.add('ready');
          setTimeout(
            () => document.body.classList.add('hide-splash-screen'),
            400,
          );
        }
      }

      let previousRouteConfigurationData = routeConfigurationData;

      if (event instanceof RouteConfigLoadStart) {
        routeConfigurationData = event.route.data as RouteConfigurationData;
      }

      if (event instanceof NavigationStart) {
        navigationUrl = event.url;
        clearTimeout(navigationLoadingTimerHandle);

        if (
          previousRouteConfigurationData &&
          !previousRouteConfigurationData.preventLoadingHint
        ) {
          navigationLoadingTimerHandle = setTimeout(() => {
            navigationLoadingHandler = this.loadingService.show('加载中...');
          }, 100);
        }
      } else if (
        (event instanceof NavigationEnd || event instanceof NavigationCancel) &&
        navigationUrl === event.url
      ) {
        clearTimeout(navigationLoadingTimerHandle);

        if (navigationLoadingHandler) {
          navigationLoadingHandler.clear();
          navigationLoadingHandler = undefined;
        }
      }
    });
  }
}
