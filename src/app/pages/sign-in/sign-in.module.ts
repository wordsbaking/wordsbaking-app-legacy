import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreUIModule} from 'app/core/ui';

import {SignInView} from './sign-in.view';

const routes: Routes = [
  {
    path: '',
    component: SignInView,
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
  declarations: [SignInView],
})
export class SignInModule {}
