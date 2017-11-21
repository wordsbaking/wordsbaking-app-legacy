import {Component} from '@angular/core';

import {
  DialogComponentBase,
  DialogComponentInitOptions,
} from '../common/dialog-component-base';

export interface ConfirmComponentInitOptions {
  okCallback(): void;
}

@Component({
  selector: 'wb-dialog-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.less'],
})
export class ConfirmComponent extends DialogComponentBase<string> {
  private okCallback: () => void;

  wbOnComponentFactoryInit(
    options: DialogComponentInitOptions<string> & ConfirmComponentInitOptions,
  ): void {
    super.wbOnComponentFactoryInit(options);

    this.okCallback = options.okCallback;
  }

  onOk(): void {
    this.okCallback();
    this.close();
  }

  onCancel(): void {
    this.close();
  }
}
