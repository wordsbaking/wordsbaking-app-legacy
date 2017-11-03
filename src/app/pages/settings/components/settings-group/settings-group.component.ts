import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-settings-view-settings-group',
  templateUrl: './settings-group.component.html',
  styleUrls: ['./settings-group.component.less'],
})
export class SettingsGroupComponent {
  @Input() title: string;
}
