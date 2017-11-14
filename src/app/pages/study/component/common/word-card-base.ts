import {HostBinding} from '@angular/core';
import {Sentence, WordInfo} from 'app/core/engine';

export abstract class WordCardBase {
  abstract word: WordInfo;

  @HostBinding('class.active') active = false;

  element: HTMLElement;
  elementStyle: CSSStyleDeclaration;
  innerElement: HTMLElement;
  innerElementStyle: CSSStyleDeclaration;
  audioIconElement: HTMLElement;
  audioIconElementStyle: CSSStyleDeclaration;

  @HostBinding('class.new-word')
  get isNewWord(): boolean {
    return this.word.new;
  }

  @HostBinding('class.marked-word')
  get isMarkedWord(): boolean {
    return this.word.marked;
  }

  @HostBinding('class.obstinate-word')
  get isObstinateWord(): boolean {
    return this.word.obstinate;
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

  get meanings(): string[] {
    return this.word.meanings.map(meaning => {
      let poss = meaning.poss;
      let posStr = poss && poss.length && poss[0] ? `${poss.join('.&')}. ` : '';

      return posStr + meaning.text;
    });
  }

  get sentence(): Sentence | undefined {
    let {sentences} = this.word;
    return sentences && sentences[0];
  }

  setActive(): void {
    this.active = true;
  }

  setInactive(): void {
    this.active = false;
  }

  viewInit() {
    let {element} = this;

    this.elementStyle = element.style;
    this.innerElement = element.querySelector('.inner') as HTMLElement;
    this.innerElementStyle = this.innerElement.style;
    this.audioIconElement = element.querySelector('.icon.audio') as HTMLElement;
    this.audioIconElementStyle = this.audioIconElement.style;
  }
}
