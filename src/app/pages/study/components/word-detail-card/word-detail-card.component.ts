import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
} from '@angular/core';

import * as v from 'villa';

import * as logger from 'logger';

import {SettingsConfigService} from 'app/core/config';
import {WordInfo} from 'app/core/engine';
import {TTSService} from 'app/platform/common';

import {
  CompleteCallback,
  ProgressCallback,
  WordCardComponentBase,
} from '../common/word-card-component-base';

import {
  wordDetailCardTransitions,
  wordDetailCardUnlockCountdownTransitions,
} from './word-detail-card.animations';

@Component({
  selector: 'wb-study-view-word-detail-card',
  templateUrl: './word-detail-card.component.html',
  styleUrls: ['./word-detail-card.component.less'],
  animations: [
    wordDetailCardTransitions,
    wordDetailCardUnlockCountdownTransitions,
  ],
})
export class WordDetailCardComponent extends WordCardComponentBase
  implements AfterViewInit, OnDestroy {
  @Input('data') word: WordInfo;
  @Input('active') activeEvent = new EventEmitter<void>();
  @Input('removing') removingEvent = new EventEmitter<void>();

  @HostBinding('@wordDetailCardTransitions') wordDetailCardTransitions = true;

  hideUnlockCountdown = false;

  private autoPlayAudioTimerHandle: number;

  constructor(
    ref: ElementRef,
    ttsService: TTSService,
    settingsConfigService: SettingsConfigService,
  ) {
    super(ttsService, settingsConfigService);

    this.element = ref.nativeElement;

    settingsConfigService.audioMode$
      .first()
      .toPromise()
      .then(async audioMode => {
        if (audioMode !== 'off') {
          this.autoPlayAudioTimerHandle = setTimeout(() => {
            this.reciteTerm().catch(logger.error);
          }, 800);
        }
      })
      .catch(logger.error);
  }

  get lock(): boolean {
    return this.hideUnlockCountdown ? false : this.obstinate;
  }

  async unlock(): Promise<void> {
    await v.sleep(400);

    this.hideUnlockCountdown = true;
  }

  onSlideX(
    diffX: number,
    startTime: number,
    isEnd: boolean,
    progress: ProgressCallback | undefined,
    complete: CompleteCallback | undefined,
  ): void {
    super.onSlideX(Math.max(diffX, 0), startTime, isEnd, progress, complete);
  }

  ngAfterViewInit(): void {
    this.onViewInit();
  }

  ngOnDestroy(): void {
    clearTimeout(this.autoPlayAudioTimerHandle);
  }
}
