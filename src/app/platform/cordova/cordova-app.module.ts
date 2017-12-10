import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {
  AppService,
  PlatformAppModule,
  RoutingService,
  TTSService,
} from '../common';

import {CordovaAppService} from './cordova-app.service';
import {CordovaRoutingService} from './cordova-routing.service';
import {CordovaTTSService} from './cordova-tts.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CordovaAppModule extends PlatformAppModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CordovaAppModule,
      providers: [
        {
          provide: AppService,
          useClass: CordovaAppService,
        },
        {
          provide: RoutingService,
          useClass: CordovaRoutingService,
        },
        {
          provide: TTSService,
          useClass: CordovaTTSService,
        },
      ],
    };
  }
}
