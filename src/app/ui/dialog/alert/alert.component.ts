import {Component} from '@angular/core';

import {DialogComponentBase} from '../common/dialog-component-base';

@Component({
  selector: 'wb-dialog-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.less'],
})
export class AlertComponent extends DialogComponentBase<string> {}
