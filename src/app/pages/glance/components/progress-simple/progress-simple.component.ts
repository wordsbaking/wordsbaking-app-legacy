import {Component, Input} from '@angular/core';

@Component({
  selector: 'wb-glance-view-progress-simple',
  templateUrl: './progress-simple.component.html',
  styleUrls: ['./progress-simple.component.less'],
})
export class ProgressSimpleComponent {
  @Input() title: string;
  @Input() done: number | undefined;
  @Input() total: number | undefined;

  get doneText(): string {
    let done = this.done;
    return typeof done === 'number' ? done.toString() : '-';
  }

  get slashTotalText(): string {
    let total = this.total;
    return typeof total === 'number' ? `/${total}` : '';
  }
}
