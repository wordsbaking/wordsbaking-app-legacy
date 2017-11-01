import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';

const signInViewTransition = trigger('signInViewTransition', [...pageTransitions]);

@Component({
  selector: 'wb-view.sign-in-view',
  templateUrl: './sign-in.view.html',
  styleUrls: ['./sign-in.view.less'],
  animations: [signInViewTransition],
})
export class SignInView {
  @HostBinding('@signInViewTransition') signInViewTransition = '';
}
