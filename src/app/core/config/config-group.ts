import {NgZone} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {DBStorage} from 'app/core/storage';

export interface ConfigGroupItem {
  id: string;
  [key: string]: any;
}

export abstract class ConfigGroup<
  TExposed extends object,
  TRaw extends object = Partial<TExposed>
> {
  readonly update$ = new Subject<string>();

  readonly storage$ = Observable.from(
    DBStorage.create<string, ConfigGroupItem>({
      name: 'default',
      tableName: this.tableName,
      primaryKeyType: 'text',
    }),
  );

  readonly config$ = this.storage$
    .switchMap(async storage => {
      let raw = ((await storage.getAllAsDict()) as any) as TRaw;
      return this.transformRaw(raw);
    })
    .repeatWhen(() => this.update$)
    .publishReplay(1)
    .refCount();

  constructor(readonly tableName: string, readonly zone: NgZone) {}

  async set<K extends keyof TRaw>(
    name: keyof TRaw,
    value: TRaw[K],
  ): Promise<void> {
    let storage = await this.storage$.toPromise();

    await storage.set(name, value);

    this.update$.next(name);
    this.zone.run(() => {});
  }

  /**
   * Calling reset will result in dirty state, APPLICATION HAS TO BE RELOADED
   * therefore.
   */
  async reset(): Promise<void> {
    let storage = await this.storage$.toPromise();
    await storage.empty();
  }

  protected getObservable<K extends keyof TExposed>(
    name: K,
  ): Observable<TExposed[K]> {
    return this.config$
      .map(config => config[name])
      .distinctUntilChanged()
      .publishReplay(1)
      .refCount();
  }

  protected abstract transformRaw(raw: TRaw): TExposed;
}
