import {EventEmitter, HostBinding} from '@angular/core';

import {Sentence, WordInfo} from 'app/core/engine';

import {Easing, animate, momentum} from 'app/lib/animate';

export type CompleteCallback = () => void;
export type ProgressCallback = (percentage: number) => void;

export enum WordCardState {
  active,
  inactive,
  removed,
}

export const WORD_CARD_WIDTH = 320;
export const WORD_CARD_HEIGHT = 54;
export const WORD_CARD_SEPARATE = 15;

export abstract class WordCardComponentBase {
  abstract word: WordInfo;
  abstract activeEvent: EventEmitter<void>;
  abstract removingEvent: EventEmitter<void>;

  element: HTMLElement;

  protected elementStyle: CSSStyleDeclaration;
  protected innerElement: HTMLElement;
  protected innerElementStyle: CSSStyleDeclaration;
  protected audioIconElement: HTMLElement;
  protected audioIconElementStyle: CSSStyleDeclaration;

  private state: WordCardState = WordCardState.inactive;

  constructor() {
    this.respondSideXToRight = this.respondSideXToRight.bind(this);
  }

  @HostBinding('class.active')
  get active(): boolean {
    return this.state === WordCardState.active;
  }

  set active(state: boolean) {
    if (this.removed || state === this.active) {
      return;
    }

    if (state) {
      this.activeEvent.emit();
    }

    this.state = state ? WordCardState.active : WordCardState.inactive;
  }

  @HostBinding('class.removed')
  get removed(): boolean {
    return this.state === WordCardState.removed;
  }

  set removed(state: boolean) {
    if (!this.removed && state) {
      this.state = WordCardState.removed;
      this.removingEvent.emit();
    }
  }

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

  onViewInit() {
    let {element} = this;

    this.elementStyle = element.style;
    this.innerElement = element.querySelector('.inner') as HTMLElement;
    this.innerElementStyle = this.innerElement.style;
    this.audioIconElement = element.querySelector('.icon.audio') as HTMLElement;
    this.audioIconElementStyle = this.audioIconElement.style;
  }

  onSlideX(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    if (offset > 0) {
      this.onSlideXToRight(offset, startTime, isEnd, progress, complete);
    } else {
      // TODO: onSlideXToLeft
    }
  }

  onSlideY(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {}

  private onSlideXToRight(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let x = Math.max(offset, 0);
    let percentage = x / WORD_CARD_WIDTH;

    this.respondSideXToRight(x);

    if (progress) {
      progress(percentage);
    }

    if (isEnd && x > 0) {
      let momentumInfo = momentum(
        x,
        0,
        WORD_CARD_WIDTH,
        Date.now() - startTime,
      );
      let newX = momentumInfo.destination ? 0 : WORD_CARD_WIDTH;

      animate(
        x,
        newX,
        Math.min(momentumInfo.duration, 200),
        Easing.circular,
        this.respondSideXToRight,
      )
        .then(() => {
          if (complete && newX === WORD_CARD_WIDTH) {
            complete();
          }
        })
        .catch(() => undefined);
    }

    // function update(x: number) {

    //   // if (percentage > 0.25) {
    //   //   let offsetX = Math.min(percentage - 0.25, 0.75) / 0.75 * 0.75 * 100;
    //   //   markedHintElementStyle.transform = `translateX(${offsetX}%)`;
    //   // } else {
    //   //   markedHintElementStyle.transform = 'translateX(0%)';
    //   // }

    //   // if (percentage > 0.8) {
    //   //   markedHintElementStyle.opacity = (1 -
    //   //     Math.min(percentage - 0.8, 0.2) / 0.2) as any;
    //   // } else if (percentage > 0.1) {
    //   //   markedHintElementStyle.opacity = (Math.min(percentage - 0.1, 0.32) /
    //   //     0.32) as any;
    //   // } else {
    //   //   markedHintElementStyle.opacity = 0 as any;
    //   // }
    // }
  }

  private respondSideXToRight(x: number): void {
    let {innerElementStyle} = this;
    let percentage = x / WORD_CARD_WIDTH;
    innerElementStyle.transform = `translate(${x}px, 0)`;
    innerElementStyle.opacity = (1 - percentage) as any;
  }
}
