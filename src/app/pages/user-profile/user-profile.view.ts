import {trigger} from '@angular/animations';
import {Component, HostBinding} from '@angular/core';

import {pageTransitions} from 'app/core/ui';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

const userProfileViewTransitions = trigger('userProfileViewTransitions', [
  ...pageTransitions,
]);

@Component({
  selector: 'wb-view.user-profile-view',
  templateUrl: './user-profile.view.html',
  styleUrls: ['./user-profile.view.less'],
  animations: [userProfileViewTransitions],
})
export class UserProfileView {
  @HostBinding('@userProfileViewTransitions') userProfileViewTransitions = '';

  avatarUrl$ = new BehaviorSubject<string>('https://picsum.photos/128/128');
}
