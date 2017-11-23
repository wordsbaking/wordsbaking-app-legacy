import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {PressLinkDirective} from './press-link.directive';
import {PressDirective} from './press.directive';
import {TapLinkDirective} from './tap-link.directive';
import {TapDirective} from './tap.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [
    TapDirective,
    TapLinkDirective,
    PressLinkDirective,
    PressDirective,
  ],
  exports: [TapDirective, TapLinkDirective, PressLinkDirective, PressDirective],
})
export class TouchModule {}
