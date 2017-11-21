import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {UIModule} from 'app/ui';

import {CoreUIModule} from 'app/core/ui';

import {
  WordStack,
  WordStackComponent,
} from './components/word-stack/word-stack.component';

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
export class RecycleBinModule {
  recentWordStack$ = new BehaviorSubject<WordStack | undefined>(undefined);

  constructor() {
    this.recentWordStack$.next({
      title: '最近删除的词条',
      words: [
        'amount',
        'whenever',
        'Sweden',
        'tennis',
        'gradually',
        'run away',
        'safari',
        'house',
      ],
    });
  }
}
