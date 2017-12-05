import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreNavigationModule} from 'app/core/navigation';
import {CoreUIModule} from 'app/core/ui';

import {WelcomeView} from './welcome.view';

const routes: Routes = [
  {
    path: '',
    component: WelcomeView,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UIModule,
    CoreUIModule,
    CoreNavigationModule,
    RouterModule.forChild(routes),
  ],
  declarations: [WelcomeView],
})
export class WelcomeModule {}
