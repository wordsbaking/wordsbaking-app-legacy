import {Component} from '@angular/core';

import {OnComponentFactoryInit} from 'app/ui';

export interface CordovaAppUpdateTipComponentInitOptions {
  version: string;
  beta: boolean;
  description?: string;
  downloadUrl?: string;
  clear(): void;
}

@Component({
  selector: 'wb-cordova-app-update-tip',
  templateUrl: './cordova-app-update-tip.component.html',
  styleUrls: ['./cordova-app-update-tip.component.less'],
})
export class CordovaAppUpdateTipComponent
  implements OnComponentFactoryInit<CordovaAppUpdateTipComponentInitOptions> {
  version = '';
  isBeta = false;
  descriptionItems: string[] = [];
  downloadUrl: string;

  private clearHandler: () => void;

  wbOnComponentFactoryInit(
    options: CordovaAppUpdateTipComponentInitOptions,
  ): void {
    this.version = options.version;
    this.isBeta = options.beta;

    let description = options.description || '无更新公告!';

    let descriptionItems: string[] = [];

    if (description.indexOf('[x]') === -1) {
      descriptionItems.push(description);
    } else {
      descriptionItems = description.split(/\s*\[x\]\s*/);
      descriptionItems.shift();
      descriptionItems = descriptionItems.map(
        (item, index) => `${index + 1}. ${item}`,
      );
    }

    this.descriptionItems = descriptionItems;
    this.downloadUrl = options.downloadUrl!;
    this.clearHandler = options.clear;
  }

  nextTime(): void {
    if (this.clearHandler) {
      this.clearHandler();
    }
  }

  close(): void {
    if (this.clearHandler) {
      this.clearHandler();
    }
  }
}
