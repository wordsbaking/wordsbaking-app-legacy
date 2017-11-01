import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-glance-view-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.less'],
})
export class ProgressComponent {
  @Input() title: string;
  @Input() info: string;
  @Input() percentage: number;
  @Input() pendingPercentage: number;
}
