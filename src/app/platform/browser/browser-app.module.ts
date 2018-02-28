import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {TouchModule} from 'app/ui';

import {
  AppService,
  PlatformAppModule,
  RoutingService,
  TTSService,
} from '../common';

import {BrowserAppService} from './browser-app.service';
import {BrowserRoutingService} from './browser-routing.service';
import {BrowserTTSService} from './browser-tts.service';

@NgModule({
  imports: [CommonModule, TouchModule],
})
export class BrowserAppModule extends PlatformAppModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: BrowserAppModule,
      providers: [
        {
          provide: AppService,
          useClass: BrowserAppService,
        },
        {
          provide: RoutingService,
          useClass: BrowserRoutingService,
        },
        {
          provide: TTSService,
          useClass: BrowserTTSService,
        },
      ],
    };
  }
}
