import {Component, HostBinding} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {snackbarTransitions} from './snackbar.animations';

@Component({
  selector: 'wb-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.less'],
  animations: [snackbarTransitions],
})
export class SnackbarComponent {
  @HostBinding('@snackbarTransitions') enableSnackbarTransitions = true;

  text$ = new BehaviorSubject<string | undefined>(undefined);
  actionText$ = new BehaviorSubject<string | undefined>(undefined);
}
