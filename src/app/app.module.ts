import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

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
    CoreDataModule.forRoot(),
    CoreNavigationModule.forRoot(),
  ],
  declarations: [AppView],
  bootstrap: [AppView],
})
export class AppModule {}
