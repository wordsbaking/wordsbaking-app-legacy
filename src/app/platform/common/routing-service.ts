import {
  ActivationEnd,
  ActivationStart,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Route,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {LoadingHandler, LoadingService, ToastService} from 'app/ui';

export type RouteEventType =
  | NavigationStart
  | RouteConfigLoadStart
  | RouteConfigLoadEnd
  | ActivationStart
  | ActivationEnd
  | NavigationCancel
  | NavigationEnd
  | NavigationError;

export abstract class RoutingService {
  routeConfigurationData$ = new BehaviorSubject<
    RouteConfigurationData | undefined
  >(undefined);

  activeRoute$ = new BehaviorSubject<Route | undefined>(undefined);

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
  onRouteConfigLoadStart(_event: RouteConfigLoadStart): void {}
  onRouteConfigLoadEnd(_event: RouteConfigLoadEnd): void {}
  onNavigationEnd(_event: NavigationEnd): void {}
  onActivationStart(_event: ActivationStart): void {}
  onActivationEnd(_event: ActivationEnd): void {}
  onNavigationCancel(_event: NavigationCancel): void {}
  onNavigationError(_event: NavigationError): void {}

  protected handleRouteEvent(event: RouteEventType): void {
    let {routeConfigurationData$} = this;
    let previousRouteConfigurationData = routeConfigurationData$.value;
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
    } else if (event instanceof RouteConfigLoadStart) {
      // this.routeConfigurationData$.next(event.route
      //   .data as RouteConfigurationData);
      this.onRouteConfigLoadStart(event);
    } else if (event instanceof RouteConfigLoadEnd) {
      this.onRouteConfigLoadEnd(event);
    } else if (event instanceof ActivationStart) {
      this.routeConfigurationData$.next(event.snapshot
        .data as RouteConfigurationData);
      this.onActivationStart(event);
    } else if (event instanceof ActivationEnd) {
      this.activeRoute$.next(event.snapshot.routeConfig as Route);
      this.onActivationEnd(event);
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
