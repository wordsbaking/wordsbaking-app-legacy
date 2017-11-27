import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';

const signUpViewTransitions = trigger('signUpViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.sign-up-view',
  templateUrl: './sign-up.view.html',
  styleUrls: ['./sign-up.view.less'],
  animations: [signUpViewTransitions],
})
export class SignUpView {
  @HostBinding('@signUpViewTransitions') signUpViewTransitions = '';

  whyAccountDescriptionVisible = false;

  toggleWhyAccountDescriptionDisplay(): void {
    this.whyAccountDescriptionVisible = !this.whyAccountDescriptionVisible;
  }
}
