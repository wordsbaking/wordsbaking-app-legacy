import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
} from '@angular/core';

import {WordInfo} from 'app/core/engine';

@Component({
  selector: 'wb-study-view-word-item',
  templateUrl: './word-item.component.html',
  styleUrls: ['./word-item.component.less'],
})
export class WordItemComponent implements AfterViewInit {
  @Input('data') word: WordInfo;

  @Input('expanded') expanded: boolean;

  @HostBinding('class.active') active = false;

  element: HTMLElement;
  elementStyle: CSSStyleDeclaration;
  innerElement: HTMLElement;
  innerElementStyle: CSSStyleDeclaration;
  wordBriefElement: HTMLElement;
  wordBriefElementStyle: CSSStyleDeclaration;
  markedHintElement: HTMLElement;
  markedHintElementStyle: CSSStyleDeclaration;

  constructor(ref: ElementRef) {
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
    let {element} = this;
    this.elementStyle = element.style;
    this.innerElement = element.querySelector(
      '.word-item-inner',
    ) as HTMLElement;
    this.innerElementStyle = this.innerElement.style;
    this.wordBriefElement = element.querySelector('.word-brief') as HTMLElement;
    this.wordBriefElementStyle = this.wordBriefElement.style;
    this.markedHintElement = element.querySelector(
      '.marked-hint',
    ) as HTMLElement;
    this.markedHintElementStyle = this.markedHintElement.style;
  }
}
