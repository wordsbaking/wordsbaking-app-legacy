import {
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Injectable,
  OnDestroy,
} from '@angular/core';

import {Subscription} from 'rxjs/Subscription';

import {ViewContainerService} from '../util';

import {SnackbarComponent} from './snackbar.component';

export interface SnackbarInfo {
  componentRef: ComponentRef<SnackbarComponent>;
  duration: number;
  timer: number | undefined;
  subscription: Subscription;
}

export interface SnackbarHandler {
  result: Promise<void>;
  setText(content: string): void;
  setActionText(actionText: string): void;
  clear(): void;
}

@Injectable()
export class SnackbarService implements OnDestroy {
  private snackbarInfoSet = new Set<SnackbarInfo>();

  constructor(
    private viewContainerService: ViewContainerService,
    private resolve: ComponentFactoryResolver,
  ) {}

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
      subscription: new Subscription(),
    };

    this.snackbarInfoSet.add(snackbarInfo);

    snackbarComponent.text$.next(text);
    snackbarComponent.actionText$.next(actionText);

    let result = new Promise<void>(resolve => {
      snackbarComponent.actionEvent$.first().subscribe(() => {
        clearTimeout(snackbarInfo.timer!);
        snackbarHandler.clear();
        resolve();
      });
    });

    let snackbarHandler = {
      result,
      setText: (content: string) => snackbarComponent.text$.next(content),
      setActionText: (actionText: string) =>
        snackbarComponent.actionText$.next(actionText),
      clear: () => this.clear(snackbarInfo),
    };

    if (duration && duration !== Infinity) {
      snackbarInfo.timer = setTimeout(snackbarHandler.clear, duration);
    }

    return snackbarHandler;
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
    snackbarInfo.subscription.unsubscribe();
    this.snackbarInfoSet.delete(snackbarInfo);
  }
}
