import {Component, ElementRef, HostBinding} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';

import {snackbarTransitions} from './snackbar.animations';

let zIndex = 0;

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
  actionEvent$ = new Subject<Event>();

  constructor(ref: ElementRef) {
    let element = ref.nativeElement as HTMLElement;
    element.style.zIndex = `${zIndex++}`;
  }

  triggerAction(event: Event): void {
    this.actionEvent$.next(event);
  }
}
