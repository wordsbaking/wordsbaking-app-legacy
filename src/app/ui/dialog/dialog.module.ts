import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {PopupModule} from '../popup';
import {TouchModule} from '../touch';

import {AlertComponent} from './alert/alert.component';
import {ConfirmComponent} from './confirm/confirm.component';
import {DialogService} from './dialog.service';

@NgModule({
  imports: [CommonModule, PopupModule, TouchModule],
  declarations: [ConfirmComponent, AlertComponent],
  entryComponents: [ConfirmComponent, AlertComponent],
  exports: [],
})
export class DialogModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: DialogModule,
      providers: [DialogService],
    };
  }
}
