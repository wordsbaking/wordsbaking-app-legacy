import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import {CoreCommonModule} from 'app/core/common';
import {CoreConfigModule} from 'app/core/config';
import {CoreDataModule} from 'app/core/data';
import {CoreEngineModule} from 'app/core/engine';
import {CoreNavigationModule} from 'app/core/navigation';
import {CoreUIModule} from 'app/core/ui';
import {CoreUserModule} from 'app/core/user';

import {UIModule} from 'app/ui';

import {AppRouting} from 'app/app.routing';
import {AppView} from 'app/app.view';

import {SplashScreenView} from 'app/pages/splash-screen/splash-screen.view';

import {BrowserAppService, BrowserRoutingService} from './platform/browser';
import {AppService, RoutingService} from './platform/common';
import {CordovaAppService, CordovaRoutingService} from './platform/cordova';

import {
  AuthGuardService,
  WelcomePageGuardService,
} from './app-router-guard-services';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    CoreUIModule,
    AppRouting,
    UIModule.forRoot(),
    CoreCommonModule.forRoot(),
    CoreConfigModule.forRoot(),
    CoreUserModule.forRoot(),
    CoreDataModule.forRoot(),
    CoreEngineModule.forRoot(),
    CoreNavigationModule.forRoot(),
  ],
  declarations: [AppView, SplashScreenView],
  bootstrap: [AppView],
  providers: [
    AuthGuardService,
    WelcomePageGuardService,
    {
      provide: RoutingService,
      useClass: window.cordova ? CordovaRoutingService : BrowserRoutingService,
    },
    {
      provide: AppService,
      useClass: window.cordova ? CordovaAppService : BrowserAppService,
    },
  ],
})
export class AppModule {}
