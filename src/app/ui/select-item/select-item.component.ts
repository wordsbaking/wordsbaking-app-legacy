import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-selection-list-option',
  templateUrl: './select-option.component.html',
  styleUrls: ['./select-option.component.less'],
})
export class SelectOptionComponent {
  @Input() data: any;
}
