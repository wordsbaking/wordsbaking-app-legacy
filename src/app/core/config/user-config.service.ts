import {Injectable} from '@angular/core';

import {SyncService} from 'app/core/data';

import {ConfigGroup} from './config-group';

export interface UserConfig {
  today: TimeNumber;
  lastActiveAt: TimeNumber;
}

@Injectable()
export class UserConfigService extends ConfigGroup<UserConfig> {
  readonly today$ = this.getObservable('today');
  readonly lastActiveAt$ = this.getObservable('lastActiveAt');

  constructor(syncService: SyncService) {
    super('user', syncService, syncService.user);
  }

  protected transformRaw({
    today = 0 as TimeNumber,
    lastActiveAt = 0 as TimeNumber,
  }: Partial<UserConfig>): UserConfig {
    return {today, lastActiveAt};
  }
}
