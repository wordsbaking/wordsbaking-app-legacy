import {Component} from '@angular/core';

import {OnComponentFactoryInit} from 'app/ui';

import {SelectionListPopup} from './selection-list-popup.types';

export interface SelectionListPopupInitOptions<T> {
  hint: string | undefined;
  items: SelectionListPopup.ListItem<T>[];
  multiple?: boolean;
  onSelected(value: T[]): void;
}

@Component({
  selector: 'wb-selection-list-popup',
  templateUrl: './selection-list-popup.component.html',
  styleUrls: ['./selection-list-popup.component.less'],
})
export class SelectionListPopupComponent<T>
  implements OnComponentFactoryInit<SelectionListPopupInitOptions<T>> {
  options: SelectionListPopupInitOptions<T>;
  items: SelectionListPopup.ListItem<T>[];
  multiple: boolean;

  get hint(): string | undefined {
    return this.options.hint;
  }

  wbOnComponentFactoryInit(options: SelectionListPopupInitOptions<T>): void {
    this.items = options.items;
    this.multiple = !!options.multiple;
    this.options = options;
  }

  onSelectionListChange(values: T[]): void {
    this.options.onSelected(values);
  }
}
