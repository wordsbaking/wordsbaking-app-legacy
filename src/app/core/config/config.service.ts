import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';

import {DBStorage} from 'app/core/storage';

const CONFIG_KEY = 'default';

export interface ConfigItemExtension {
  syncAt?: TimeNumber;
  apiKey?: string;
}

export type ConfigItemName = keyof ConfigItemExtension;

export interface ConfigItem extends ConfigItemExtension {
  id: string;
}

@Injectable()
export class ConfigService {
  readonly storage$ = Observable.from(
    DBStorage.create<string, ConfigItem>({
      name: 'default',
      tableName: 'config',
      primaryKeyType: 'text',
    }),
  );

  readonly config$ = this.storage$
    .switchMap(async storage => {
      let {syncAt = 0 as TimeNumber, apiKey} =
        (await storage.get(CONFIG_KEY)) || ({} as ConfigItem);

      return {syncAt, apiKey};
    })
    .repeatWhen(() => this.storage$.map(storage => storage.change$))
    .publishReplay(1)
    .refCount();

  readonly apiKey$ = this.config$
    .map(config => config.apiKey)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  readonly syncAt$ = this.config$
    .map(config => config.syncAt)
    .distinctUntilChanged()
    .publishReplay(1)
    .refCount();

  async set(name: ConfigItemName, value: any): Promise<void> {
    let storage = await this.storage$.toPromise();
    let config =
      (await storage.get(CONFIG_KEY)) || ({id: CONFIG_KEY} as ConfigItem);

    config[name] = value;

    await storage.set(config);
  }

  async reset(): Promise<void> {
    let storage = await this.storage$.toPromise();

    await storage.remove(CONFIG_KEY);
  }
}
