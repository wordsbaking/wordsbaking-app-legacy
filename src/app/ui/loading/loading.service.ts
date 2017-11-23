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

export interface LoadingHandler {
  result: Promise<void>;
  hint$: BehaviorSubject<string>;
  clear(): void;
}

export interface LoadingInfo {
  componentRef: ComponentRef<LoadingComponent>;
  options: LoadingShowOptions;
  handler: LoadingHandler;
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

  wait(
    process: Promise<any>,
    hint: string,
    options?: LoadingShowOptions,
  ): LoadingHandler;
  wait(
    process: Promise<any>,
    hint: string,
    container: ViewContainerRef,
    options?: LoadingShowOptions,
  ): LoadingHandler;
  wait(
    process: Promise<any>,
    hint: string,
    arg3?: any,
    arg4?: any,
  ): LoadingHandler {
    let container: ViewContainerRef =
      arg3 && arg3 instanceof ViewContainerRef
        ? arg3
        : this.viewContainerService.viewContainerRef;

    let options: LoadingShowOptions =
      (!(arg3 && arg3 instanceof ViewContainerRef) ? arg3 : arg4) || {};

    let loadingHandler = this.mount(hint, container, options);

    process.then(loadingHandler.clear, loadingHandler.clear);

    return loadingHandler;
  }

  show(hint: string, options?: LoadingShowOptions): LoadingHandler;
  show(
    hint: string,
    container: ViewContainerRef,
    options?: LoadingShowOptions,
  ): LoadingHandler;
  show(hint: string, arg2?: any, arg3?: any): LoadingHandler {
    let container: ViewContainerRef =
      arg2 && arg2 instanceof ViewContainerRef
        ? arg2
        : this.viewContainerService.viewContainerRef;

    let options: LoadingShowOptions =
      (!(arg2 && arg2 instanceof ViewContainerRef) ? arg2 : arg3) || {};

    return this.mount(hint, container, options);
  }

  clearAll(): void {
    for (let info of this.loadingInfoSet) {
      this.clear(info);
    }
  }

  private mount(
    hint: string,
    containerRef: ViewContainerRef,
    options: LoadingShowOptions,
  ): LoadingHandler {
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
    let handler: LoadingHandler;

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
      hint$,
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
