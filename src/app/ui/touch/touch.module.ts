import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TapLinkDirective} from './tap-link.directive';
import {TapDirective} from './tap.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [TapDirective, TapLinkDirective],
  exports: [TapDirective, TapLinkDirective],
})
export class TouchModule {}
