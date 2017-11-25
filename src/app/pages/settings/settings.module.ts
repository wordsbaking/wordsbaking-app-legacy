import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreSettingsModule} from 'app/core/settings';
import {CoreUIModule} from 'app/core/ui';

import {SettingsGroupComponent, SettingsItemComponent} from './components';

import {SettingsView} from './settings.view';

const routes: Routes = [
  {
    path: '',
    component: SettingsView,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    CommonModule,
    UIModule,
    CoreUIModule,
    CoreSettingsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [SettingsView, SettingsGroupComponent, SettingsItemComponent],
})
export class SettingsModule {}
