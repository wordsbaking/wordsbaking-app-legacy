import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  ViewContainerRef,
} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {ViewContainerService} from '../../ui/util';

import {LoadingComponent} from './loading.component';

export interface LoadingShowOptions {
  background?: string;
}

export interface LoadingHandler<T> {
  result: Promise<T>;
  setText(hint: string): void;
  clear(): void;
}

export interface LoadingInfo {
  componentRef: ComponentRef<LoadingComponent>;
  options: LoadingShowOptions;
  handler: LoadingHandler<any>;
  onClear(): void;
}

@Injectable()
export class LoadingService {
  private loadingInfoSet = new Set<LoadingInfo>();

  private latestFullScreenLoadingInfo: LoadingInfo | undefined;

  constructor(
    private resolve: ComponentFactoryResolver,
    private viewContainerService: ViewContainerService,
  ) {}

  get active(): boolean {
    return !!this.loadingInfoSet.size;
  }

  get hasFullScreenLoading(): boolean {
    return !!this.latestFullScreenLoadingInfo;
  }

  wait<T>(
    process: Promise<T>,
    hint: string,
    options?: LoadingShowOptions,
  ): LoadingHandler<T>;
  wait<T>(
    process: Promise<T>,
    hint: string,
    container: ViewContainerRef,
    options?: LoadingShowOptions,
  ): LoadingHandler<T>;
  wait<T>(
    process: Promise<T>,
    hint: string,
    container?: ViewContainerRef | LoadingShowOptions,
    options?: LoadingShowOptions,
  ): LoadingHandler<T> {
    if (!(container instanceof ViewContainerRef)) {
      options = container;
      container = this.viewContainerService.viewContainerRef;
    }

    let loadingHandler = this.mount(hint, container, options || {});
    loadingHandler.result = process;
    process.then(loadingHandler.clear, loadingHandler.clear);

    return loadingHandler;
  }

  show(hint: string, options?: LoadingShowOptions): LoadingHandler<void>;
  show(
    hint: string,
    container: ViewContainerRef,
    options?: LoadingShowOptions,
  ): LoadingHandler<void>;
  show(
    hint: string,
    container?: ViewContainerRef | LoadingShowOptions,
    options?: LoadingShowOptions,
  ): LoadingHandler<void> {
    if (!(container instanceof ViewContainerRef)) {
      options = container;
      container = this.viewContainerService.viewContainerRef;
    }

    return this.mount(hint, container, options || {});
  }

  clearAll(): void {
    for (let info of this.loadingInfoSet) {
      this.clear(info);
    }
  }

  clearFullScreenLoading(): void {
    if (this.hasFullScreenLoading) {
      this.clear(this.latestFullScreenLoadingInfo!);
    }
  }

  private mount(
    hint: string,
    containerRef: ViewContainerRef,
    options: LoadingShowOptions,
  ): LoadingHandler<any> {
    let {latestFullScreenLoadingInfo} = this;
    let loadingComponentFactory = this.resolve.resolveComponentFactory(
      LoadingComponent,
    );
    let isFullScreen =
      containerRef === this.viewContainerService.viewContainerRef;

    let hint$: BehaviorSubject<string>;
    let componentRef: ComponentRef<LoadingComponent>;

    let {background} = options;

    if (isFullScreen && latestFullScreenLoadingInfo) {
      componentRef = latestFullScreenLoadingInfo.componentRef;
      hint$ = componentRef.instance.hint$;
      hint$.next(hint);
      componentRef.instance.backgroundColor = background || '';
    } else {
      hint$ = new BehaviorSubject<string>(hint);
      componentRef = containerRef.createComponent(loadingComponentFactory);

      if (componentRef.instance.wbOnComponentFactoryInit) {
        componentRef.instance.wbOnComponentFactoryInit({
          hint$,
          background,
        });
      }
    }

    let loadingInfo: LoadingInfo;
    let handler: LoadingHandler<void>;

    let result = new Promise<void>(onClear => {
      loadingInfo = {
        componentRef,
        options,
        handler,
        onClear,
      };

      this.loadingInfoSet.add(loadingInfo);

      if (isFullScreen) {
        this.latestFullScreenLoadingInfo = loadingInfo;
      }
    });

    handler = {
      result,
      setText: (hint: string) => hint$.next(hint),
      clear: () => {
        if (this.latestFullScreenLoadingInfo === loadingInfo) {
          this.clear(loadingInfo);
        }
      },
    };

    return handler;
  }

  private clear(info: LoadingInfo): void {
    info.componentRef.destroy();
    this.loadingInfoSet.delete(info);
    info.onClear();

    if (info === this.latestFullScreenLoadingInfo) {
      this.latestFullScreenLoadingInfo = undefined;
    }
  }
}
