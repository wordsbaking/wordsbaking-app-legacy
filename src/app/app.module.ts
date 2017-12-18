import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import {IdlePreload, IdlePreloadModule} from 'angular-idle-preload';

import {CoreCommonModule} from 'app/core/common';
import {CoreConfigModule} from 'app/core/config';
import {CoreDataModule} from 'app/core/data';
import {CoreEngineModule} from 'app/core/engine';
import {CoreNavigationModule} from 'app/core/navigation';
import {CoreUIModule} from 'app/core/ui';
import {CoreUserModule} from 'app/core/user';

import {UIModule} from 'app/ui';

import {appRoutes} from 'app/app.routing';
import {AppView} from 'app/app.view';

import {SplashScreenView} from 'app/pages/splash-screen/splash-screen.view';

import {environment} from '../environments/environment';
import {BrowserAppModule} from './platform/browser';
import {CordovaAppModule} from './platform/cordova';

import {
  AuthGuardService,
  WelcomePageGuardService,
} from './app-router-guard-services';

const PlatformAppModule = environment.hybirdApp
  ? CordovaAppModule
  : BrowserAppModule;

(window as any).requestIdleCallback = (load: Function) => {
  setTimeout(load, 3000);
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    PlatformAppModule.forRoot(),
    RouterModule,
    CoreUIModule,
    IdlePreloadModule.forRoot(),
    RouterModule.forRoot(appRoutes, {
      preloadingStrategy: IdlePreload,
    }),
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
  providers: [AuthGuardService, WelcomePageGuardService],
})
export class AppModule {}
