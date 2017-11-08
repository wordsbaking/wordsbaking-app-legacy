import {Component, OnDestroy, TemplateRef, ViewChild} from '@angular/core';

import {PopupHandler, PopupShowOptions} from './popup-types';
import {PopupService} from './popup.service';

@Component({
  selector: 'wb-popup',
  template: '<ng-template #contentView><ng-content></ng-content></ng-template>',
  styles: [':host { display: none; }'],
})
export class PopupComponent implements OnDestroy {
  @ViewChild('contentView') contentView: TemplateRef<void>;

  private popupHandler: PopupHandler | undefined;

  constructor(private popupService: PopupService) {}

  showAsDropDown(
    context: HTMLElement,
    options: PopupShowOptions = {},
  ): PopupHandler {
    this.popupHandler = this.popupService.showAsDropDown(
      this.contentView,
      context,
      options,
    );
    return this.popupHandler;
  }

  showAsLocation(
    optionsOrContext?: PopupShowOptions | HTMLElement,
    options?: any,
  ): PopupHandler {
    if (optionsOrContext instanceof HTMLElement) {
      this.popupHandler = this.popupService.showAsLocation(
        this.contentView,
        optionsOrContext,
        options,
      );
    } else {
      this.popupHandler = this.popupService.showAsLocation(
        this.contentView,
        optionsOrContext,
      );
    }

    return this.popupHandler;
  }

  clear(): void {
    if (this.popupHandler) {
      this.popupHandler.clear();
      this.popupHandler = undefined;
    }
  }

  ngOnDestroy(): void {
    this.clear();
  }
}
