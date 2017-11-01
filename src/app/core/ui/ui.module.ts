import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {PageModule} from './page';

@NgModule({
  imports: [CommonModule, PageModule],
  exports: [PageModule],
})
export class CoreUIModule {}
