import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
} from '@angular/core';

import {ViewContainerService} from '../util';

import {ToastComponent} from './toast.component';

export interface ToastInfo {
  componentRef: ComponentRef<ToastComponent>;
  duration: number;
  timer: number | undefined;
}

export interface ToastHandler {
  setText(content: string): void;
  clear(): void;
}

export const TOAST_LENGTH_SHORT = 3000;
export const TOAST_LENGTH_LONG = 6000;

@Injectable()
export class ToastService {
  private toastInfoSet = new Set<ToastInfo>();

  constructor(
    private viewContainerService: ViewContainerService,
    private resolve: ComponentFactoryResolver,
  ) {}

  show(content: string, duration: number = TOAST_LENGTH_SHORT): ToastHandler {
    let componentFactory = this.resolve.resolveComponentFactory(ToastComponent);
    let componentRef: ComponentRef<
      ToastComponent
    > = this.viewContainerService.viewContainerRef.createComponent(
      componentFactory,
    );

    let toastComponent = componentRef.instance;

    let toastInfo: ToastInfo = {
      duration,
      timer: undefined,
      componentRef,
    };

    this.toastInfoSet.add(toastInfo);

    toastComponent.content$.next(content);

    let toastHandler = {
      setText: (content: string) => toastComponent.content$.next(content),
      clear: () => this.clear(toastInfo),
    };

    if (duration !== Infinity) {
      toastInfo.timer = setTimeout(toastHandler.clear, duration);
    }

    return toastHandler;
  }

  clearAll(): void {
    for (let toastInfo of this.toastInfoSet) {
      this.clear(toastInfo);
    }
  }

  private clear(toastInfo: ToastInfo): void {
    if (toastInfo.timer) {
      clearTimeout(toastInfo.timer);
    }

    toastInfo.componentRef.destroy();

    this.toastInfoSet.delete(toastInfo);
  }
}
