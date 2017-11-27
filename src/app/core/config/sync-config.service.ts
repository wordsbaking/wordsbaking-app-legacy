import {Injectable, NgZone} from '@angular/core';

import {ConfigGroup} from './config-group';

interface SyncConfig {
  syncAt: TimeNumber;
}

@Injectable()
export class SyncConfigService extends ConfigGroup<SyncConfig> {
  readonly syncAt$ = this.getObservable('syncAt');

  constructor(zone: NgZone) {
    super('sync', zone);
  }

  protected transformRaw({
    syncAt = 0 as TimeNumber,
  }: Partial<SyncConfig>): SyncConfig {
    return {syncAt};
  }
}
