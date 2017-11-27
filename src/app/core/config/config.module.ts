import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {AuthConfigService} from './auth-config.service';
import {SettingsConfigService} from './settings-config.service';
import {SyncConfigService} from './sync-config.service';
import {UserConfigService} from './user-config.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreConfigModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreConfigModule,
      providers: [
        AuthConfigService,
        SettingsConfigService,
        SyncConfigService,
        UserConfigService,
      ],
    };
  }
}
