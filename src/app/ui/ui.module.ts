import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {PopupModule} from './popup';
import {SelectionListItemComponent} from './selection-list-item/selection-list-item.component';
import {SelectionListComponent} from './selection-list/selection-list.component';
import {SwitchComponent} from './switch/switch.component';
import {TouchModule} from './touch/touch.module';
import {ViewContainerService} from './util/view-container.service';

@NgModule({
  imports: [CommonModule, TouchModule, PopupModule],
  declarations: [
    SwitchComponent,
    SelectionListComponent,
    SelectionListItemComponent,
  ],
  exports: [
    TouchModule,
    SwitchComponent,
    PopupModule,
    SelectionListComponent,
    SelectionListItemComponent,
  ],
})
export class UIModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: UIModule,
      providers: [ViewContainerService, ...PopupModule.forRoot().providers],
    };
  }
}
