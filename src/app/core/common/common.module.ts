import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {APIService} from './api.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreCommonModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreCommonModule,
      providers: [APIService],
    };
  }
}
