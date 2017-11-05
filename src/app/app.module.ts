import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

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
    UIModule,
    CoreNavigationModule.forRoot(),
  ],
  declarations: [AppView],
  bootstrap: [AppView],
})
export class AppModule {}
