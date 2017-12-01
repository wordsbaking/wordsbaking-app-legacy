import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {ViewContainerService} from './util/view-container.service';

import {DialogModule} from './dialog';
import {LoadingModule} from './loading';
import {PopupModule} from './popup';
import {ToastModule} from './toast';
import {TouchModule} from './touch';

import {SelectionListItemComponent} from './selection-list-item/selection-list-item.component';
import {SelectionListComponent} from './selection-list/selection-list.component';
import {SwitchComponent} from './switch/switch.component';

@NgModule({
  imports: [
    CommonModule,
    TouchModule,
    PopupModule,
    DialogModule,
    LoadingModule,
    ToastModule,
  ],
  declarations: [
    SwitchComponent,
    SelectionListComponent,
    SelectionListItemComponent,
  ],
  exports: [
    TouchModule,
    SwitchComponent,
    PopupModule,
    DialogModule,
    SelectionListComponent,
    SelectionListItemComponent,
    LoadingModule,
  ],
})
export class UIModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: UIModule,
      providers: [
        ViewContainerService,
        ...PopupModule.forRoot().providers,
        ...DialogModule.forRoot().providers,
        ...LoadingModule.forRoot().providers,
        ...ToastModule.forRoot().providers,
      ],
    };
  }
}
