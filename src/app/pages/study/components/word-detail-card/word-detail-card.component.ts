import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
} from '@angular/core';

import * as logger from 'logger';

import {SettingsConfigService} from 'app/core/config';
import {WordInfo} from 'app/core/engine';
import {TTSService} from 'app/platform/common';

import {
  CompleteCallback,
  ProgressCallback,
  WordCardComponentBase,
} from '../common/word-card-component-base';

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
        if (audioMode === 'auto') {
          await this.playAudio();
        }
      })
      .catch(logger.error);
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
}
