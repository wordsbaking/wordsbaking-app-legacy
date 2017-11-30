import {OnDestroy} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import {memorize} from 'memorize-decorator';

import {SyncCategory, SyncService} from 'app/core/data';
import {DBStorage} from 'app/core/storage';

export abstract class ConfigGroup<
  TExposed extends object,
  TRaw extends object = Partial<TExposed>
> implements OnDestroy {
  readonly update$ = new Subject<string>();

  readonly storage$: Observable<DBStorage<string, any>> | undefined;

  readonly config$: Observable<TExposed>;

  protected subscription = new Subscription();

  constructor(tableName: string);
  constructor(
    tableName: string,
    syncService: SyncService,
    syncCategory: SyncCategory,
  );
  constructor(
    readonly tableName: string,
    private syncService?: SyncService,
    private syncCategory?: SyncCategory,
  ) {
    if (syncService) {
      this.config$ = syncCategory!.itemMap$
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
    } else {
      this.storage$ = Observable.from(
        DBStorage.create<string, any>({
          name: 'default',
          tableName: this.tableName,
          primaryKeyType: 'text',
        }),
      );

      let change$ = this.storage$.switchMap(storage => storage.change$);

      this.config$ = this.storage$
        .switchMap(async storage => {
          let raw = ((await storage.getAllAsDict()) as any) as TRaw;
          return this.transformRaw(raw);
        })
        .repeatWhen(() => change$)
        .publishReplay(1)
        .refCount();

      this.subscription.add(this.config$.subscribe());
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async set<K extends keyof TRaw>(
    name: keyof TRaw,
    value: TRaw[K],
  ): Promise<void> {
    // tslint:disable-next-line:no-null-keyword
    let jsonValue = value === undefined ? null : value;

    if (this.syncCategory) {
      await this.syncService!.update(this.syncCategory, name, jsonValue);
    } else {
      let storage = await this.storage$!.toPromise();
      await storage.set(name, jsonValue);
    }
  }

  /**
   * Calling reset will result in dirty state, APPLICATION HAS TO BE RELOADED
   * therefore.
   */
  async reset(): Promise<void> {
    if (this.syncCategory) {
      await this.syncCategory.reset();
    } else {
      let storage = await this.storage$!.toPromise();
      await storage.empty();
    }
  }

  @memorize()
  getObservable<K extends keyof TExposed>(name: K): Observable<TExposed[K]> {
    return this.config$.map(config => config[name]).distinctUntilChanged();
  }

  protected abstract transformRaw(raw: TRaw): TExposed;
}
