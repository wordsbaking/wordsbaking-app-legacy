import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {LoadingComponent} from './loading.component';
import {LoadingService} from './loading.service';

@NgModule({
  imports: [CommonModule],
  declarations: [LoadingComponent],
  entryComponents: [LoadingComponent],
  exports: [LoadingComponent],
})
export class LoadingModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: LoadingModule,
      providers: [LoadingService],
    };
  }
}
