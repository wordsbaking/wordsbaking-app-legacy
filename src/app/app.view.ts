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
    return this.outlet.activatedRouteData.target;
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
    let firstPage = true;
    let isSplashScreenPage = false;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        isSplashScreenPage = event.url === '/';
      }

      if (event instanceof NavigationStart) {
        if (isSplashScreenPage) {
          return;
        }

        navigationUrl = event.url;
        clearTimeout(navigationLoadingTimerHandle);

        navigationLoadingTimerHandle = setTimeout(() => {
          navigationLoadingHandler = this.loadingService.show('加载中...');
        }, firstPage ? 600 : 100);

        firstPage = false;
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
