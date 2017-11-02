import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TouchModule} from './touch/touch.module';

@NgModule({
  imports: [CommonModule, TouchModule],
  exports: [TouchModule],
})
export class UIModule {}
