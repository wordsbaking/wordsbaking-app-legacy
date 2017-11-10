import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {PopupBackgroundComponent} from './popup-background.component';
import {PopupContainerComponent} from './popup-container.component';
import {PopupComponent} from './popup.component';
import {PopupService} from './popup.service';

@NgModule({
  imports: [CommonModule],
  declarations: [
    PopupContainerComponent,
    PopupBackgroundComponent,
    PopupComponent,
  ],
  entryComponents: [PopupContainerComponent, PopupBackgroundComponent],
  exports: [PopupComponent],
})
export class PopupModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PopupModule,
      providers: [PopupService],
    };
  }
}
