import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';

import {DBStorage, DBStorageItem} from 'app/core/storage';

const CONFIG_KEY = 'default';

export interface ConfigItemExtension {
  syncAt?: TimeNumber;
}

export type ConfigItemName = keyof ConfigItemExtension;

export interface ConfigItem
  extends DBStorageItem<string>,
    ConfigItemExtension {}

@Injectable()
export class ConfigService {
  readonly storage$ = Observable.from(
    DBStorage.create<string, ConfigItem>({
      name: 'default',
      tableName: 'config',
      idType: 'text',
    }),
  );

  readonly config$ = this.storage$
    .switchMap(async storage => {
      let {syncAt = 0 as TimeNumber} =
        (await storage.get(CONFIG_KEY)) || ({} as ConfigItem);

      return {syncAt};
    })
    .repeatWhen(() => this.storage$.map(storage => storage.change$))
    .publishReplay(1)
    .refCount();

  readonly syncAt$ = this.config$
    .map(config => config.syncAt)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  async set(name: ConfigItemName, value: any): Promise<void> {
    let storage = await this.storage$.toPromise();
    let config = (await storage.get(CONFIG_KEY)) || ({} as ConfigItem);

    config[name] = value;

    await storage.set(config);
  }

  async reset(): Promise<void> {
    let storage = await this.storage$.toPromise();

    await storage.remove(CONFIG_KEY);
  }
}
