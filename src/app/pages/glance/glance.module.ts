import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CoreUIModule} from 'app/core/ui';

import {GlanceView} from './glance.view';

import {
  CollectionSelectorComponent,
  ProgressComponent,
  ProgressSimpleComponent,
  RecentStudyComponent,
} from './components';

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
  declarations: [
    GlanceView,
    CollectionSelectorComponent,
    ProgressComponent,
    ProgressSimpleComponent,
    RecentStudyComponent,
  ],
})
export class GlanceModule {}
