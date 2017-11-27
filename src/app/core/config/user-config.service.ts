import {Injectable, NgZone} from '@angular/core';

import {ConfigGroup} from './config-group';

export interface UserConfig {
  today: TimeNumber;
  lastActiveAt: TimeNumber;
}

@Injectable()
export class UserConfigService extends ConfigGroup<UserConfig> {
  readonly today$ = this.getObservable('today');
  readonly lastActiveAt$ = this.getObservable('lastActiveAt');

  constructor(zone: NgZone) {
    super('user', zone);
  }

  protected transformRaw({
    today = 0 as TimeNumber,
    lastActiveAt = 0 as TimeNumber,
  }: Partial<UserConfig>): UserConfig {
    return {today, lastActiveAt};
  }
}
