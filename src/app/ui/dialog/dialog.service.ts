import {ComponentFactoryResolver, Injectable} from '@angular/core';

import {PopupContentType, PopupService, PopupShowOptions} from '../popup';

import {DialogComponentInitOptions} from './common/dialog-component-base';

import {AlertComponent} from './alert/alert.component';
import {
  ConfirmComponent,
  ConfirmComponentInitOptions,
} from './confirm/confirm.component';

const DEFAULT_POPUP_SHOW_OPTIONS: PopupShowOptions = {
  positions: ['bottom'],
  animation: 'fadeInDown',
  width: 'match-parent',
  background: true,
  clearOnClick: false,
  clearOnOutsideClick: false,
  clearOnWindowResize: false,
  clearOnWindowScroll: false,
};

@Injectable()
export class DialogService {
  constructor(
    private popupService: PopupService,
    private resolve: ComponentFactoryResolver,
  ) {}

  confirm(content: string, options: PopupShowOptions = {}): Promise<boolean> {
    let confirmComponentFactory = this.resolve.resolveComponentFactory(
      ConfirmComponent,
    );

    return new Promise<boolean>((resolve, reject) => {
      let contentOptions: ConfirmComponentInitOptions = {
        ...options.contentOptions,
        okCallback: () => {
          if (options.contentOptions && options.contentOptions.okCallback) {
            options.contentOptions.okCallback();
          }

          resolve(true);
        },
      };

      this.show(confirmComponentFactory, content, {
        ...options,
        contentOptions,
      })
        .then(() => resolve(false))
        .catch(() => reject);
    });
  }

  alert(content: string, options: PopupShowOptions = {}): Promise<void> {
    let alertComponentFactory = this.resolve.resolveComponentFactory(
      AlertComponent,
    );

    return this.show(alertComponentFactory, content, options);
  }

  private async show<T>(
    contentFactory: PopupContentType,
    content: T,
    options: PopupShowOptions = {},
  ): Promise<void> {
    let contentOptions: DialogComponentInitOptions<any> = {
      ...options.contentOptions,
      content,
      close: () => popupHandler.clear(),
    };

    let popupHandler = this.popupService.showAsLocation(contentFactory, {
      ...DEFAULT_POPUP_SHOW_OPTIONS,
      ...options,
      contentOptions,
    });

    return popupHandler.result;
  }
}
