import {
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Injectable,
  OnDestroy,
} from '@angular/core';

import {ViewContainerService} from '../util';

import {SnackbarComponent} from './snackbar.component';

export interface SnackbarInfo {
  componentRef: ComponentRef<SnackbarComponent>;
  duration: number;
  timer: number | undefined;
}

export interface SnackbarHandler {
  setText(content: string): void;
  setActionText(actionText: string): void;
  clear(): void;
}

let zIndex = 0;

@Injectable()
export class SnackbarService implements OnDestroy {
  private snackbarInfoSet = new Set<SnackbarInfo>();

  constructor(
    private viewContainerService: ViewContainerService,
    private resolve: ComponentFactoryResolver,
    private ref: ElementRef,
  ) {
    let element = this.ref.nativeElement.style;

    element.style.zIndex = zIndex++;
  }

  show(
    text: string,
    actionText: string,
    duration: number = 0,
  ): SnackbarHandler {
    let componentFactory = this.resolve.resolveComponentFactory(
      SnackbarComponent,
    );

    let componentRef: ComponentRef<
      SnackbarComponent
    > = this.viewContainerService.viewContainerRef.createComponent(
      componentFactory,
    );

    let snackbarComponent = componentRef.instance;

    let snackbarInfo: SnackbarInfo = {
      duration,
      timer: undefined,
      componentRef,
    };

    this.snackbarInfoSet.add(snackbarInfo);

    snackbarComponent.text$.next(text);
    snackbarComponent.actionText$.next(actionText);

    let toastHandler = {
      setText: (content: string) => snackbarComponent.text$.next(content),
      setActionText: (actionText: string) =>
        snackbarComponent.actionText$.next(actionText),
      clear: () => this.clear(snackbarInfo),
    };

    if (duration && duration !== Infinity) {
      snackbarInfo.timer = setTimeout(toastHandler.clear, duration);
    }

    return toastHandler;
  }

  clearAll(): void {
    for (let snackbarInfo of this.snackbarInfoSet) {
      this.clear(snackbarInfo);
    }
  }

  ngOnDestroy(): void {
    this.clearAll();
  }

  private clear(snackbarInfo: SnackbarInfo): void {
    if (snackbarInfo.timer) {
      clearTimeout(snackbarInfo.timer);
    }

    snackbarInfo.componentRef.destroy();

    this.snackbarInfoSet.delete(snackbarInfo);
  }
}
