import {Component, Input} from '@angular/core';

export interface RecentStudyInfo {
  dailyStudyInfos: DailyStudyInfo[];
  averageDaily: number;
  dailyTotalMax: number;
}

export interface DailyStudyInfo {
  date: Date;
  total: number;
  none: boolean;
}

@Component({
  selector: 'wb-glance-view-recent-study',
  templateUrl: './recent-study.component.html',
  styleUrls: ['./recent-study.component.less'],
})
export class RecentStudyComponent {
  @Input('data') object: RecentStudyInfo;
}
