import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {TouchModule} from '../touch';

import {SnackbarComponent} from './snackbar.component';
import {SnackbarService} from './snackbar.service';

@NgModule({
  imports: [CommonModule, TouchModule],
  declarations: [SnackbarComponent],
  entryComponents: [SnackbarComponent],
  exports: [],
})
export class SnackbarModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SnackbarModule,
      providers: [SnackbarService],
    };
  }
}
