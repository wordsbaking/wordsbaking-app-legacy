import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import {CoreUIModule} from 'app/core/ui';

import {AppRouting} from './app.routing';
import {AppView} from './app.view';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, RouterModule, CoreUIModule, AppRouting],
  declarations: [AppView],
  bootstrap: [AppView],
})
export class AppModule {}
