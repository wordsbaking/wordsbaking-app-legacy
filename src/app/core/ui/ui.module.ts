import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {PageModule} from './page';
import {SelectionListPopupModule} from './selection-list-popup';

@NgModule({
  imports: [CommonModule, PageModule, SelectionListPopupModule],
  exports: [PageModule, SelectionListPopupModule],
  declarations: [],
})
export class CoreUIModule {}
