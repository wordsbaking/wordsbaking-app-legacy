import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreUIModule} from 'app/core/ui';

import {
  WordCardComponent,
  WordCardDetailComponent,
  WordStackComponent,
} from './component';
import {StudyComponent} from './study.view';

const routes: Routes = [
  {
    path: '',
    component: StudyComponent,
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
    StudyComponent,
    WordStackComponent,
    WordCardComponent,
    WordCardDetailComponent,
  ],
})
export class StudyModule {}
