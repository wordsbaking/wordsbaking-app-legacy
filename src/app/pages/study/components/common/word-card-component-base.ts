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

function noop() {}

export abstract class WordCardComponentBase {
  abstract word: WordInfo;
  abstract activeEvent: EventEmitter<void>;
  abstract removingEvent: EventEmitter<void>;

  element: HTMLElement;
  expandedRemovalConfirmButtons = false;
  animating = false;

  protected elementStyle: CSSStyleDeclaration;
  protected innerElement: HTMLElement;
  protected innerElementStyle: CSSStyleDeclaration;
  protected contentElement: HTMLElement;
  protected contentElementStyle: CSSStyleDeclaration;
  protected audioIconElement: HTMLElement;
  protected audioIconElementStyle: CSSStyleDeclaration;
  protected removalConfirmButtonsElement: HTMLElement;
  protected removalConfirmButtonsElementStyle: CSSStyleDeclaration;

  private state: WordCardState = WordCardState.inactive;
  private latestSlideXOffset = 0;

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
    } else {
      if (this.expandedRemovalConfirmButtons) {
        this.foldRemovalConfirmButtons();
      }
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

  remove(): Promise<void> {
    return Promise.resolve(undefined);
  }

  onViewInit() {
    let {element} = this;

    this.elementStyle = element.style;
    this.innerElement = element.querySelector('.inner') as HTMLElement;
    this.innerElementStyle = this.innerElement.style;
    this.contentElement = element.querySelector('.content') as HTMLElement;
    this.contentElementStyle = this.contentElement.style;
    this.audioIconElement = element.querySelector('.icon.audio') as HTMLElement;
    this.audioIconElementStyle = this.audioIconElement.style;
    this.removalConfirmButtonsElement = element.querySelector(
      '.removal-confirm-buttons',
    ) as HTMLElement;
    this.removalConfirmButtonsElementStyle = this.removalConfirmButtonsElement.style;
  }

  foldRemovalConfirmButtons(): void {
    if (this.expandedRemovalConfirmButtons) {
      this.expandedRemovalConfirmButtons = false;
      this.animating = true;

      animate(1, 0, 200, Easing.circular, this.respondSideXToLeft.bind(this))
        .then(() => {
          this.animating = false;
          this.removalConfirmButtonsElementStyle.opacity = 0 as any;
          this.latestSlideXOffset = 0;
        })
        .catch(noop);
    }
  }

  onSlideX(
    diffX: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    if (this.animating) {
      return;
    }

    let fixedDiffX = diffX + this.latestSlideXOffset;

    if (fixedDiffX >= 0) {
      this.onSlideXToRight(fixedDiffX, startTime, isEnd, progress, complete);
    } else {
      this.onSlideXToLeft(fixedDiffX, startTime, isEnd, progress, complete);
    }
  }

  onSlideY(
    offset: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    if (this.animating) {
      return;
    }

    if (this.expandedRemovalConfirmButtons) {
      this.foldRemovalConfirmButtons();
    }
  }

  private onSlideXToLeft(
    diffX: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let maxWidth = this.removalConfirmButtonsElement.offsetWidth;
    let maxOffset = -maxWidth;
    let offset = Math.min(diffX, 0);
    let x = Math.max(offset, maxOffset);
    let percentage = Math.abs(x) / maxWidth;

    this.contentElementStyle.opacity = 1 as any;
    this.removalConfirmButtonsElementStyle.opacity = 1 as any;

    this.respondSideXToLeft(percentage);

    if (progress) {
      progress(percentage);
    }

    if (isEnd) {
      if (percentage < 1) {
        let expanded =
          percentage >= 0.5 &&
          (!this.latestSlideXOffset || offset <= this.latestSlideXOffset);

        this.latestSlideXOffset = expanded ? maxOffset : 0;
        this.animating = true;
        this.expandedRemovalConfirmButtons = expanded;

        animate(
          percentage,
          expanded ? 1 : 0,
          200,
          Easing.circular,
          this.respondSideXToLeft.bind(this),
        )
          .then(() => {
            this.animating = false;
            if (!expanded) {
              this.removalConfirmButtonsElementStyle.opacity = 0 as any;
            }
          })
          .catch(noop);
      } else {
        this.latestSlideXOffset = maxOffset;
        this.expandedRemovalConfirmButtons = true;
      }
    }
  }

  private onSlideXToRight(
    diffX: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    let offset = Math.max(diffX, 0);
    let percentage = offset / WORD_CARD_WIDTH;

    this.respondSideXToRight(offset);

    this.expandedRemovalConfirmButtons = false;
    this.removalConfirmButtonsElementStyle.opacity = 0 as any;

    if (progress) {
      progress(percentage);
    }

    if (isEnd && offset > 0) {
      let momentumInfo = momentum(
        offset,
        0,
        WORD_CARD_WIDTH,
        Date.now() - startTime,
      );

      let newX = momentumInfo.destination ? 0 : WORD_CARD_WIDTH;

      this.animating = true;

      animate(
        offset,
        newX,
        Math.min(momentumInfo.duration, 200),
        Easing.circular,
        this.respondSideXToRight.bind(this),
      )
        .then(() => {
          this.animating = false;
          if (complete && newX === WORD_CARD_WIDTH) {
            complete();
          }
        })
        .catch(noop);
    }

    if (isEnd) {
      this.latestSlideXOffset = 0;
    }
  }

  private respondSideXToRight(x: number): void {
    let percentage = x / WORD_CARD_WIDTH;
    this.contentElementStyle.transform = `translate3d(${x}px, 0, 0)`;
    this.contentElementStyle.opacity = (1 - percentage) as any;
  }

  private respondSideXToLeft(percentage: number): void {
    let maxOffset = -this.removalConfirmButtonsElement.offsetWidth;

    this.contentElementStyle.transform = `translate3d(${maxOffset *
      percentage}px, 0, 0)`;
  }
}