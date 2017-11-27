import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreUIModule} from 'app/core/ui';

import {
  NotificationCardComponent,
  WordCardComponent,
  WordDetailCardComponent,
  WordStackComponent,
  WordStackInteractiveDirective,
} from './components';
import {StudyView} from './study.view';

const routes: Routes = [
  {
    path: '',
    component: StudyView,
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
    RouterModule.forChild(routes),
  ],
  declarations: [
    StudyView,
    WordStackComponent,
    WordCardComponent,
    WordDetailCardComponent,
    WordStackInteractiveDirective,
    NotificationCardComponent,
  ],
})
export class StudyModule {}
