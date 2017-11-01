import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {RouterModule, Routes} from '@angular/router';

import {CoreUIModule} from 'app/core/ui';

import {SignUpView} from './sign-up.view';

const routes: Routes = [
  {
    path: '',
    component: SignUpView,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [CommonModule, CoreUIModule, RouterModule.forChild(routes)],
  declarations: [SignUpView],
  exports: [],
})
export class SignUpModule {}
