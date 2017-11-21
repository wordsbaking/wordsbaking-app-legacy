import {Component, Input} from '@angular/core';

export enum NotificationStatus {
  info,
  warning,
}

export interface Notification {
  message: string;
  status: NotificationStatus;
}

@Component({
  selector: 'wb-study-view-notification-card',
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.less'],
})
export class NotificationCardComponent {
  @Input('data') notification: Notification;

  get classes() {
    let {notification: {status}} = this;

    return {
      green: status === NotificationStatus.info,
      orange: status === NotificationStatus.warning,
    };
  }
}
