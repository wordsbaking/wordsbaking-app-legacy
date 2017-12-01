import {OnDestroy} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import {memorize} from 'memorize-decorator';

import {SyncCategory, SyncService} from 'app/core/data';
import {DBStorage} from 'app/core/storage';
import {configStorageDict, initialRawConfigDict} from 'app/preload';

const CONFIG_AUTO_SYNC_TIMEOUT = 500;

export abstract class ConfigGroup<
  TExposed extends object,
  TRaw extends object = Partial<TExposed>
> implements OnDestroy {
  readonly storage: DBStorage<string, any> | undefined;

  readonly config$: Observable<TExposed>;

  protected subscription = new Subscription();

  private syncSchedule$: Subject<void>;

  constructor(name: string);
  constructor(
    name: string,
    syncService: SyncService,
    syncCategory: SyncCategory,
  );
  constructor(
    readonly name: string,
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
        .shareReplay(1);

      this.syncSchedule$ = new Subject<void>();

      this.subscription.add(
        this.syncSchedule$
          .debounceTime(CONFIG_AUTO_SYNC_TIMEOUT)
          .subscribe(() => syncService.sync()),
      );
    } else {
      this.storage = configStorageDict[name];

      this.config$ = this.storage.change$
        .switchMap(async () => (this.storage!.getAllAsDict() as any) as TRaw)
        .startWith(initialRawConfigDict[name] as TRaw)
        .map(raw => {
          return this.transformRaw(raw);
        })
        .shareReplay(1);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async set<K extends keyof TRaw>(
    name: keyof TRaw,
    value: TRaw[K],
  ): Promise<void> {
    if (this.syncCategory) {
      await this.syncService!.update(this.syncCategory, name, value);
      this.syncSchedule$.next();
    } else {
      await this.storage!.set(name, value);
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
      await this.storage!.empty();
    }
  }

  @memorize()
  getObservable<K extends keyof TExposed>(name: K): Observable<TExposed[K]> {
    return this.config$
      .map(config => config[name])
      .distinctUntilChanged()
      .shareReplay(1);
  }

  protected abstract transformRaw(raw: TRaw): TExposed;
}
