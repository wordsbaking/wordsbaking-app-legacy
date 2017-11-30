import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreNavigationModule} from 'app/core/navigation';
import {CoreUIModule} from 'app/core/ui';

import {UserProfileView} from './user-profile.view';

const routes: Routes = [
  {
    path: '',
    component: UserProfileView,
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
  declarations: [UserProfileView],
})
export class UserProfileModule {}
