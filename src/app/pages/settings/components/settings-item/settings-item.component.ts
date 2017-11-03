import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-settings-view-settings-item',
  templateUrl: './settings-item.component.html',
  styleUrls: ['./settings-item.component.less'],
})
export class SettingsItemComponent {
  @Input() title: string;
  @Input() description: string;
}
