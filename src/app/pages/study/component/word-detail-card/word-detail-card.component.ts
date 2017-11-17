import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

import {WordCardComponentBase} from '../common/word-card-component-base';

import {wordDetailCardTransitions} from './word-detail-card.animations';

@Component({
  selector: 'wb-study-view-word-detail-card',
  templateUrl: './word-detail-card.component.html',
  styleUrls: ['./word-detail-card.component.less'],
  animations: [wordDetailCardTransitions],
})
export class WordDetailCardComponent extends WordCardComponentBase
  implements AfterViewInit {
  @Input('data') word: WordInfo;
  @Input('active') activeEvent = new EventEmitter<void>();
  @Input('removing') removingEvent = new EventEmitter<void>();

  @HostBinding('@wordDetailCardTransitions') wordDetailCardTransitions = true;

  constructor(ref: ElementRef) {
    super();

    this.element = ref.nativeElement;
  }

  ngAfterViewInit(): void {
    this.onViewInit();
  }
}
