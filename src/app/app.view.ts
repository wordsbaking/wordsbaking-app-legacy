import {
  Component,
  HostBinding,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  RouteConfigLoadStart,
  Router,
  RouterOutlet,
} from '@angular/router';

import {LoadingHandler, LoadingService, ViewContainerService} from 'app/ui';

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
    private router: Router,
    private loadingService: LoadingService,
  ) {
    viewContainerService.viewContainerRef = viewContainerRef;

    this.mountPageLoadingHint();
  }

  private mountPageLoadingHint(): void {
    let navigationUrl: string | undefined;
    let navigationLoadingHandler: LoadingHandler | undefined;
    let navigationLoadingTimerHandle: number;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        navigationUrl = event.url;
      } else if (event instanceof RouteConfigLoadStart) {
        clearTimeout(navigationLoadingTimerHandle);
        navigationLoadingTimerHandle = setTimeout(() => {
          navigationLoadingHandler = this.loadingService.show('页面加载中...');
        }, 100);
      } else if (
        event instanceof NavigationEnd &&
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
