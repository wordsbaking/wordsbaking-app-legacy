import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';

import {UserConfigService} from 'app/core/config';

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

  constructor(public userConfigService: UserConfigService) {}

  switchAudioMode(): void {}
}
