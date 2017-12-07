import {
  ActivationStart,
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  Router,
} from '@angular/router';

import {LoadingHandler, LoadingService} from 'app/ui';

export type RouteEventType =
  | NavigationStart
  | ActivationStart
  | NavigationCancel
  | NavigationEnd;

export abstract class RoutingService {
  routeConfigurationData: RouteConfigurationData | undefined;

  private navigationLoadingTimerHandle: number;
  private navigationLoadingHandler: LoadingHandler<void> | undefined;
  private readied = false;

  constructor(
    protected router: Router,
    protected loadingService: LoadingService,
  ) {}

  init(): void {
    this.router.events.subscribe(event => this.handleRouteEvent(event as any));
  }

  onNavigationStart(_event: NavigationStart): void {}
  onNavigationEnd(_event: NavigationEnd): void {}
  onActivationStart(_event: ActivationStart): void {}
  onNavigationCancel(_event: NavigationCancel): void {}

  protected handleRouteEvent(event: RouteEventType): void {
    let {routeConfigurationData} = this;
    let previousRouteConfigurationData = routeConfigurationData;

    if (event instanceof NavigationStart) {
      // Navigation start

      clearTimeout(this.navigationLoadingTimerHandle);

      if (
        previousRouteConfigurationData &&
        !previousRouteConfigurationData.preventLoadingHint
      ) {
        this.navigationLoadingTimerHandle = setTimeout(() => {
          this.navigationLoadingHandler = this.loadingService.show('加载中...');
        }, 100);
      }

      this.onNavigationStart(event);
    } else if (event instanceof ActivationStart) {
      // Activation start

      this.routeConfigurationData = event.snapshot
        .data as RouteConfigurationData;

      this.onActivationStart(event);
    } else if (
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel
    ) {
      // Navigation end/cancel
      clearTimeout(this.navigationLoadingTimerHandle);

      if (this.navigationLoadingHandler) {
        this.navigationLoadingHandler.clear();
        this.navigationLoadingHandler = undefined;
      }

      if (event instanceof NavigationEnd) {
        if (!this.readied) {
          this.readied = true;
          document.body.classList.add('ready');
        }
        this.onNavigationEnd(event);
      } else {
        this.onNavigationCancel(event);
      }
    }
  }
}
