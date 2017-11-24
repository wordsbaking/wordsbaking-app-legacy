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
    options: PopupShowOptions = {},
  ): Promise<T[] | undefined> {
    let selectionListPopupComponentFactory = this.resolve.resolveComponentFactory(
      SelectionListPopupComponent,
    );

    return new Promise<T[] | undefined>((resolve, reject) => {
      let contentOptions: SelectionListPopupInitOptions<T> = {
        items,
        onSelected: () => {
          resolve();
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
