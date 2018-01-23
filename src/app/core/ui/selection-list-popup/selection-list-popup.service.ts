import {ComponentFactoryResolver, Injectable} from '@angular/core';

import {PopupService, PopupShowOptions} from 'app/ui';

import {SelectionListPopup} from './selection-list-popup.types';

import {
  SelectionListPopupComponent,
  SelectionListPopupInitOptions,
} from './selection-list-popup.component';

const POPUP_DEFAULT_SHOW_OPTIONS: PopupShowOptions = {
  width: 'match-parent',
  positions: ['bottom'],
  animation: 'fadeInDown',
  background: true,
  margin: 0,
  clearOnOutsideClick: true,
};

@Injectable()
export class SelectionListPopupService {
  constructor(
    private popupService: PopupService,
    private resolve: ComponentFactoryResolver,
  ) {}

  show<T>(
    items: SelectionListPopup.ListItem<T>[],
    options?: PopupShowOptions,
  ): Promise<T[] | undefined>;
  show<T>(
    hint: string,
    items: SelectionListPopup.ListItem<T>[],
    options?: PopupShowOptions,
  ): Promise<T[] | undefined>;
  show<T>(arg1: any, arg2?: any, arg3?: any): any {
    let hint: string | undefined;
    let items: SelectionListPopup.ListItem<T>[];
    let options: PopupShowOptions = POPUP_DEFAULT_SHOW_OPTIONS;

    if (arguments.length === 1) {
      items = arg1;
    } else if (arguments.length === 2) {
      if (typeof arg1 === 'string') {
        hint = arg1;
        items = arg2;
      } else {
        items = arg1;
        options = arg2 || options;
      }
    } else if (arguments.length === 3) {
      hint = arg1;
      items = arg2;
      options = arg3 || options;
    }

    let selectionListPopupComponentFactory = this.resolve.resolveComponentFactory(
      SelectionListPopupComponent,
    );

    return new Promise<T[] | undefined>((resolve, reject) => {
      let contentOptions: SelectionListPopupInitOptions<T> = {
        hint,
        items,
        onSelected: values => {
          resolve(values);
          popupHandler.clear();
        },
      };

      let popupHandler = this.popupService.showAsLocation(
        selectionListPopupComponentFactory,
        {
          ...POPUP_DEFAULT_SHOW_OPTIONS,
          ...options,
          contentOptions,
        } as PopupShowOptions,
      );

      popupHandler.result.then(() => resolve(undefined), reject);
    });
  }
}
