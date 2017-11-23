import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import {CoreCommonModule} from 'app/core/common';
import {CoreConfigModule} from 'app/core/config';
import {CoreDataModule} from 'app/core/data';
import {CoreNavigationModule} from 'app/core/navigation';
import {CoreUIModule} from 'app/core/ui';

import {UIModule} from './ui';

import {AppRouting} from './app.routing';
import {AppView} from './app.view';

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
    CoreDataModule.forRoot(),
    CoreNavigationModule.forRoot(),
  ],
  declarations: [AppView],
  bootstrap: [AppView],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
})
export class AppModule {}
