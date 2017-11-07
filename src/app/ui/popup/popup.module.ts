import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {PopupBackgroundComponent} from './popup-background.component';
import {PopupComponent} from './popup.component';
import {PopupService} from './popup.service';

@NgModule({
  imports: [CommonModule],
  declarations: [PopupComponent, PopupBackgroundComponent],
  entryComponents: [PopupComponent, PopupBackgroundComponent],
})
export class PopupModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PopupModule,
      providers: [PopupService],
    };
  }
}
