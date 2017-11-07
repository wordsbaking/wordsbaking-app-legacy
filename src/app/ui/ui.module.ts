import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {PopupModule} from './popup';
import {SelectItemComponent} from './select-item/select-item.component';
import {SelectComponent} from './select/select.component';
import {SwitchComponent} from './switch/switch.component';
import {TouchModule} from './touch/touch.module';
import {ViewContainerService} from './util/view-container.service';

@NgModule({
  imports: [CommonModule, TouchModule, PopupModule, PopupModule.forRoot()],
  declarations: [SwitchComponent, SelectComponent, SelectItemComponent],
  exports: [TouchModule, SwitchComponent, PopupModule],
})
export class UIModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: UIModule,
      providers: [ViewContainerService],
    };
  }
}
