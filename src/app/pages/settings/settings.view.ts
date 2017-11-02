import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';

const settingsViewTransition = trigger('settingsViewTransition', [...pageTransitions]);

@Component({
  selector: 'wb-view.settings-view',
  templateUrl: './settings.view.html',
  styleUrls: ['./settings.view.less'],
  animations: [settingsViewTransition],
})
export class SettingsView {
  @HostBinding('@settingsViewTransition') settingsViewTransition = '';
}
