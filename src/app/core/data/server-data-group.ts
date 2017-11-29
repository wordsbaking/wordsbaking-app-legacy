import {Observable} from 'rxjs/Observable';

import {memorize} from 'memorize-decorator';

import {SyncCategory, SyncService} from 'app/core/data';
import {DBStorage} from 'app/core/storage';

export abstract class ServerDataGroup<
  TExposed extends object,
  TRaw extends object = Partial<TExposed>
> {
  readonly storage$: Observable<DBStorage<string, any>> | undefined;

  readonly data$: Observable<TExposed>;

  constructor(
    private syncService: SyncService,
    private syncCategory: SyncCategory,
  ) {
    this.data$ = syncCategory.itemMap$
      .map(itemMap => {
        // tslint:disable-next-line:no-null-keyword
        let dict: Dict<any> = Object.create(null);

        for (let [key, item] of itemMap) {
          dict[key] = item.data;
        }

        return this.transformRaw((dict as any) as TRaw);
      })
      .publishReplay(1)
      .refCount();
  }

  async set<K extends keyof TRaw>(
    name: keyof TRaw,
    value: TRaw[K],
  ): Promise<void> {
    await this.syncService.update(this.syncCategory, name, value);
  }

  /**
   * Calling reset will result in dirty state, APPLICATION HAS TO BE RELOADED
   * therefore.
   */
  async reset(): Promise<void> {
    await this.syncCategory.reset();
  }

  @memorize()
  getObservable<K extends keyof TExposed>(name: K): Observable<TExposed[K]> {
    return this.data$
      .map(data => data[name])
      .distinctUntilChanged()
      .publishReplay(1)
      .refCount();
  }

  protected abstract transformRaw(raw: TRaw): TExposed;
}
