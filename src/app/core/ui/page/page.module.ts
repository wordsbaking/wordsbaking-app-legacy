import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {PageFooterComponent} from './page-footer.component';
import {PageHeaderExtendComponent} from './page-header-extend.component';
import {PageHeaderComponent} from './page-header.component';
import {PageComponent} from './page.component';

@NgModule({
  imports: [CommonModule],
  declarations: [
    PageComponent,
    PageHeaderComponent,
    PageHeaderExtendComponent,
    PageFooterComponent,
  ],
  exports: [PageComponent, PageHeaderComponent, PageHeaderExtendComponent, PageFooterComponent],
})
export class PageModule {}
