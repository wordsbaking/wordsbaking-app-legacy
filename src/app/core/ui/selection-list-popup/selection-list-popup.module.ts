import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {UIModule} from 'app/ui';

import {SelectionListPopupComponent} from './selection-list-popup.component';
import {SelectionListPopupService} from './selection-list-popup.service';

@NgModule({
  imports: [CommonModule, UIModule],
  declarations: [SelectionListPopupComponent],
  entryComponents: [SelectionListPopupComponent],
  providers: [SelectionListPopupService],
})
export class SelectionListPopupModule {}
