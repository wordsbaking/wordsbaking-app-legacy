import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {SwitchComponent} from './switch/switch.component';
import {TouchModule} from './touch/touch.module';

@NgModule({
  imports: [CommonModule, TouchModule],
  declarations: [SwitchComponent],
  exports: [TouchModule, SwitchComponent],
})
export class UIModule {}
