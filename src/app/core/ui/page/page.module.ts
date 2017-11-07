import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {PageContentComponent} from './page-content.component';
import {PageFooterComponent} from './page-footer.component';
import {PageHeaderExtensionComponent} from './page-header-extension.component';
import {PageHeaderComponent} from './page-header.component';
import {PageComponent} from './page.component';

@NgModule({
  imports: [CommonModule],
  declarations: [
    PageComponent,
    PageHeaderComponent,
    PageHeaderExtensionComponent,
    PageContentComponent,
    PageFooterComponent,
  ],
  exports: [
    PageComponent,
    PageHeaderComponent,
    PageHeaderExtensionComponent,
    PageContentComponent,
    PageFooterComponent,
  ],
})
export class PageModule {}
