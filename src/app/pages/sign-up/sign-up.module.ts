import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

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
  imports: [
    CommonModule,
    UIModule,
    ReactiveFormsModule,
    CoreUIModule,
    RouterModule.forChild(routes),
  ],
  declarations: [SignUpView],
})
export class SignUpModule {}
