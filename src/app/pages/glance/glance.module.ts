import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CoreUIModule} from 'app/core/ui';

import {GlanceView} from './glance.view';

const routes: Routes = [
  {
    path: '',
    component: GlanceView,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [CommonModule, CoreUIModule, RouterModule.forChild(routes)],
  declarations: [GlanceView],
  exports: [],
})
export class GlanceModule {}
