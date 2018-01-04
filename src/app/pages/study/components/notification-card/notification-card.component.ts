import {Component, Input} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

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

  constructor(private sanitizer: DomSanitizer) {}

  get message(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.notification.message);
  }

  get classes() {
    let {notification: {status}} = this;

    return {
      green: status === NotificationStatus.info,
      orange: status === NotificationStatus.warning,
    };
  }
}
