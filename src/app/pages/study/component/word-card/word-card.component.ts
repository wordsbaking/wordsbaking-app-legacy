import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

import {WordCardBase} from '../common/word-card-base';

@Component({
  selector: 'wb-study-view-word-card',
  templateUrl: './word-card.component.html',
  styleUrls: ['./word-card.component.less'],
})
export class WordCardComponent extends WordCardBase implements AfterViewInit {
  @Input('data') word: WordInfo;

  briefElement: HTMLElement;
  briefElementStyle: CSSStyleDeclaration;
  markedHintElement: HTMLElement;
  markedHintElementStyle: CSSStyleDeclaration;
  labelInnerWrapperElement: HTMLElement;
  labelInnerWrapperElementStyle: CSSStyleDeclaration;

  constructor(ref: ElementRef) {
    super();
    this.element = ref.nativeElement;
  }

  @HostBinding('class.new-word')
  get isNewWord(): boolean {
    return this.word.new;
  }

  @HostBinding('class.marked-word')
  get isMarkedWord(): boolean {
    return this.word.marked;
  }

  get term(): string {
    return this.word.term;
  }

  get phonetic(): string | undefined {
    let {prons} = this.word;
    return prons ? prons.us.join(', ') : undefined;
  }

  get briefExtra(): number {
    return this.word.meanings.length - this.word.briefs.length;
  }

  get briefText(): string {
    return this.word.briefs
      .map(brief => {
        let poss = brief.poss;
        let posStr = poss && poss.length ? `${poss.join('.&')}. ` : '';
        return posStr + brief.text;
      })
      .join(' ');
  }

  setActive(): void {
    this.active = true;
  }

  setInactive(): void {
    this.active = false;
  }

  ngAfterViewInit(): void {
    this.viewInit();

    let {element} = this;

    this.briefElement = element.querySelector('.brief') as HTMLElement;
    this.briefElementStyle = this.briefElement.style;
    this.markedHintElement = element.querySelector(
      '.marked-hint',
    ) as HTMLElement;
    this.markedHintElementStyle = this.markedHintElement.style;
    this.labelInnerWrapperElement = element.querySelector(
      '.label-inner-wrapper',
    ) as HTMLElement;
    this.labelInnerWrapperElementStyle = this.labelInnerWrapperElement.style;
  }
}
