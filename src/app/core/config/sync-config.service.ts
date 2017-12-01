import {Injectable} from '@angular/core';

import {ConfigGroup} from './config-group';

export interface SyncConfig {
  syncAt: TimeNumber;
}

@Injectable()
export class SyncConfigService extends ConfigGroup<SyncConfig> {
  readonly syncAt$ = this.getObservable('syncAt');

  constructor() {
    super('sync');
  }

  protected transformRaw({
    syncAt = 0 as TimeNumber,
  }: Partial<SyncConfig>): SyncConfig {
    return {syncAt};
  }
}
