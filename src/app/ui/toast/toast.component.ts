import {Component, HostBinding} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {toastTransitions} from './toast.animations';

@Component({
  selector: 'wb-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.less'],
  animations: [toastTransitions],
})
export class ToastComponent {
  @HostBinding('@toastTransitions') enableToastTransitions = true;
  content$ = new BehaviorSubject<string | undefined>(undefined);
}
