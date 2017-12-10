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

  async speak(term: string): Promise<void> {
    let rate = await this.settingsConfigService.sentenceTtsSpeed$
      .first()
      .toPromise();
    let pronunciation = await this.settingsConfigService.pronunciation$
      .first()
      .toPromise();
    let TTS = window.TTS!;

    return new Promise<void>(resolve => {
      this.zone.run(() => {
        TTS.speak(
          {
            text: term,
            rate,
            locale: `en-${(pronunciation || 'us').toLocaleUpperCase()}`,
          },
          () => resolve(),
          () => resolve(),
        );
      });
    });
  }
}
