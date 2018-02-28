import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {TouchModule} from 'app/ui';

import {AppVersionCheckerService} from '../../app-version-checker.service';

import {
  AppService,
  PlatformAppModule,
  RoutingService,
  TTSService,
} from '../common';

import {CordovaAppUpdateTipComponent} from './components/cordova-app-update-tip/cordova-app-update-tip.component';
import {CordovaAppService} from './cordova-app.service';
import {CordovaRoutingService} from './cordova-routing.service';
import {CordovaTTSService} from './cordova-tts.service';

@NgModule({
  imports: [CommonModule, TouchModule],
  entryComponents: [CordovaAppUpdateTipComponent],
  declarations: [CordovaAppUpdateTipComponent],
  providers: [AppVersionCheckerService],
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
