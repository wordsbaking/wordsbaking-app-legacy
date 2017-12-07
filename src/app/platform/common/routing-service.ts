import {
  ActivationStart,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

import {LoadingHandler, LoadingService, ToastService} from 'app/ui';

export type RouteEventType =
  | NavigationStart
  | ActivationStart
  | NavigationCancel
  | NavigationEnd
  | NavigationError;

export abstract class RoutingService {
  routeConfigurationData: RouteConfigurationData | undefined;

  private navigationLoadingTimerHandle: number;
  private navigationLoadingHandler: LoadingHandler<void> | undefined;
  private readied = false;

  constructor(
    protected router: Router,
    protected loadingService: LoadingService,
    protected toastService: ToastService,
  ) {}

  init(): void {
    this.router.events.subscribe(event => this.handleRouteEvent(event as any));
  }

  onNavigationStart(_event: NavigationStart): void {}
  onNavigationEnd(_event: NavigationEnd): void {}
  onActivationStart(_event: ActivationStart): void {}
  onNavigationCancel(_event: NavigationCancel): void {}
  onNavigationError(_event: NavigationError): void {}

  protected handleRouteEvent(event: RouteEventType): void {
    let {routeConfigurationData} = this;
    let previousRouteConfigurationData = routeConfigurationData;
    let navigationEnded =
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError;

    if (event instanceof NavigationStart) {
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
      this.routeConfigurationData = event.snapshot
        .data as RouteConfigurationData;

      this.onActivationStart(event);
    } else if (event instanceof NavigationEnd) {
      if (!this.readied) {
        this.readied = true;
        document.body.classList.add('ready');
      }

      this.onNavigationEnd(event);
    } else if (event instanceof NavigationCancel) {
      this.onNavigationCancel(event);
    } else if (event instanceof NavigationError) {
      this.toastService.show('加载页面失败!');
      this.onNavigationError(event);
    }

    if (navigationEnded) {
      clearTimeout(this.navigationLoadingTimerHandle);

      if (this.navigationLoadingHandler) {
        this.navigationLoadingHandler.clear();
        this.navigationLoadingHandler = undefined;
      }
    }
  }
}
