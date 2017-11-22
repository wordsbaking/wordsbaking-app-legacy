import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {UIModule} from 'app/ui';

import {CoreUIModule} from 'app/core/ui';

import {WordStackComponent} from './components/word-stack/word-stack.component';

import {RecycleBinView} from './recycle-bin.view';

const routes: Routes = [
  {
    path: '',
    component: RecycleBinView,
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
  declarations: [RecycleBinView, WordStackComponent],
})
export class RecycleBinModule {}
