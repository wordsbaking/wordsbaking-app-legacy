import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {frameTransitions} from 'app/core/ui';

const signInTransitions = trigger('signInTransitions', [...frameTransitions]);

@Component({
  selector: 'wb-view.sign-in-view',
  templateUrl: './sign-in.view.html',
  styleUrls: ['./sign-in.view.less'],
  animations: [signInTransitions],
})
export class SignInView {
  @HostBinding('@signInTransitions') signInTransitions = '';
}
