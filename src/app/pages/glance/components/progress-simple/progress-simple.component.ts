import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-glance-view-progress-simple',
  templateUrl: './progress-simple.component.html',
  styleUrls: ['./progress-simple.component.less'],
})
export class ProgressSimpleComponent {
  @Input() title: string;
  @Input() info: string;
}
