import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';

import {
  AudioMode,
  SettingsConfigService,
  UserConfigService,
} from 'app/core/config';

import * as logger from 'logger';

const studyViewTransitions = trigger('studyViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.study-view',
  templateUrl: './study.view.html',
  styleUrls: ['./study.view.less'],
  animations: [studyViewTransitions],
})
export class StudyView {
  @HostBinding('@studyViewTransitions') studyViewTransitions = '';

  readonly tagline$ = this.userConfigService.tagline$;

  readonly audioMode$ = this.settingsConfigService.audioMode$;

  constructor(
    public userConfigService: UserConfigService,
    private settingsConfigService: SettingsConfigService,
  ) {}

  switchAudioMode(): void {
    let modes: AudioMode[] = ['on', 'auto', 'off'];

    this.audioMode$.first().subscribe(mode => {
      let nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
      this.settingsConfigService.set('audioMode', nextMode).catch(logger.error);
    });
  }
}
