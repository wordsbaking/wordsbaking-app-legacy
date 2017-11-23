import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {SettingsService} from './settings.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreSettingsModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreSettingsModule,
      providers: [SettingsService],
    };
  }
}
