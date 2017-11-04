import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';

const studyViewTransitions = trigger('studyViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.study-view',
  templateUrl: './study.view.html',
  styleUrls: ['./study.view.less'],
  animations: [studyViewTransitions],
})
export class StudyComponent {
  @HostBinding('@studyViewTransitions') studyViewTransitions = '';

  switchAudioMode(): void {}
}
