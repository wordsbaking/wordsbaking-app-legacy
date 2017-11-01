import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {PageFooterComponent} from './page-footer.component';
import {PageHeaderComponent} from './page-header.component';
import {PageComponent} from './page.component';

@NgModule({
  imports: [CommonModule],
  declarations: [PageComponent, PageHeaderComponent, PageFooterComponent],
  exports: [PageComponent, PageHeaderComponent, PageFooterComponent],
})
export class PageModule {}
