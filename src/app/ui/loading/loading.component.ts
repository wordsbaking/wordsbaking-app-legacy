import {Component, HostBinding} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {OnComponentFactoryInit} from 'app/ui';

import {loadingTransitions} from './loading.animations';

export interface LoadingOptions {
  hint$: BehaviorSubject<string>;
  background?: string;
}

@Component({
  selector: 'wb-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.less'],
  animations: [loadingTransitions],
})
export class LoadingComponent
  implements OnComponentFactoryInit<LoadingOptions> {
  @HostBinding('@loadingTransitions') enableLoadingTransitions = true;

  private options: LoadingOptions;

  get hint$(): BehaviorSubject<string> {
    return this.options.hint$;
  }

  @HostBinding('style.backgroundColor')
  get backgroundColor(): string {
    return this.options.background || 'rgba(0, 0, 0, 0.4)';
  }

  set backgroundColor(color: string) {
    this.options.background = color;
  }

  wbOnComponentFactoryInit(options: LoadingOptions): void {
    this.options = {...options};
  }
}
