import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {ToastComponent} from './toast.component';
import {ToastService} from './toast.service';

@NgModule({
  imports: [CommonModule],
  declarations: [ToastComponent],
  entryComponents: [ToastComponent],
  exports: [],
})
export class ToastModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: ToastModule,
      providers: [ToastService],
    };
  }
}
