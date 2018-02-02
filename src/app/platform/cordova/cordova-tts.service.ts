import {Injectable, NgZone} from '@angular/core';

import {SettingsConfigService} from 'app/core/config';

import {TTSService} from '../common';

@Injectable()
export class CordovaTTSService extends TTSService {
  constructor(
    private settingsConfigService: SettingsConfigService,
    private zone: NgZone,
  ) {
    super();
  }

  async speak(term: string, rate = 1): Promise<void> {
    let pronunciation = await this.settingsConfigService.pronunciation$
      .first()
      .toPromise();

    let TTS = window.TTS!;

    return TTS.speak({
      text: term,
      rate,
      locale: `en-${(pronunciation || 'us').toLocaleUpperCase()}`,
    });
  }

  stop(): Promise<void> {
    let TTS = window.TTS!;

    return TTS.stop();
  }
}
