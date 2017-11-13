import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {ConfigService} from 'app/core/config/config.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreConfigModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreConfigModule,
      providers: [ConfigService],
    };
  }
}
