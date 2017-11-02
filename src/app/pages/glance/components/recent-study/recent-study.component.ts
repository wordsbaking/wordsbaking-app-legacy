import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-glance-view-recent-study',
  templateUrl: './recent-study.component.html',
  styleUrls: ['./recent-study.component.less'],
})
export class RecentStudyComponent {
  @Input() recentAverageInfo: string;
}
