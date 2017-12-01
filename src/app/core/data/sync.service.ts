// tslint:disable:no-null-keyword

import {Injectable, OnDestroy} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subscription} from 'rxjs/Subscription';

import * as _ from 'lodash';
import memorize from 'memorize-decorator';
import * as ms from 'ms';
import * as v from 'villa';

import {ToastService} from 'app/ui';

import {APIService} from 'app/core/common';
import {SettingsRawConfig, UserConfig} from 'app/core/config';
import {SyncConfigService} from 'app/core/config/sync';
import {AppData} from 'app/core/data';
import {StudyRecordData} from 'app/core/engine';
import {DBStorage} from 'app/core/storage';

import * as logger from 'logger';

import {
  AccumulationDataEntryTypeDefinition,
  AccumulationUpdateData,
  CollectionData,
  DataEntryType,
  DataEntryTypeManager,
  SyncItem,
  UpdateItem,
  ValueDataEntryTypeDefinition,
} from './types';

const SYNC_BATCH_TIMEOUT = ms('10s');

interface SyncRequest {
  syncAt: number;
  time: number;
  updates: Dict<Dict<UpUpdate>>;
}

interface SyncResult {
  syncAt: TimeNumber;
  /**
   * category -> entry Name -> entry
   */
  updates: Dict<Dict<DownUpdate>>;
}

interface DownUpdate {
  value?: any;
  removed?: true;
}

interface UpUpdate {
  type?: DataEntryType;
  updateAt: TimeNumber;
  data: any;
  removed?: true;
}

export type SyncUpdateMerger<Data, Update> = (
  original: Data,
  update: Update,
) => Data;

export type SyncUpdatesCombiner<Update> = (
  updateA: Update,
  updateB: Update,
) => Update;

export type SyncUpdateMarker<Update> = (update: Update) => boolean;

export type PassiveCategoryName = 'collections';

export type CategoryName =
  | 'app'
  | 'user'
  | 'settings'
  | 'statistics'
  | 'records'
  | 'collections';

export type CategoryHost = {[key in CategoryName]: SyncCategory};

@Injectable()
export class SyncService implements CategoryHost, OnDestroy {
  /**
   * This is different from `syncAt`, while `syncAt` is time of server, it is
   * of client.
   */
  readonly lastSyncTime$ = new BehaviorSubject(0 as TimeNumber);
  readonly syncing$ = new BehaviorSubject(false);

  readonly app: SyncCategory<AppData>;
  readonly user: SyncCategory<UserConfig>;
  readonly settings: SyncCategory<SettingsRawConfig>;
  readonly statistics: SyncCategory;
  readonly records: SyncCategory<Dict<StudyRecordData>>;
  readonly collections: SyncCategory<Dict<CollectionData>>;

  readonly categoryNames: CategoryName[];

  readonly syncPending$: Observable<number>;

  private typeManager = new DataEntryTypeManager();

  private subscription = new Subscription();

  private syncBatchScheduler = new v.BatchScheduler<void>(async () => {
    await this.sync();
  }, SYNC_BATCH_TIMEOUT);

  constructor(
    readonly apiService: APIService,
    readonly toastService: ToastService,
    readonly syncConfigService: SyncConfigService, // readonly url: string, // readonly auth?: AuthData, // readonly dbStorageName = DEFAULT_DATA_TYPE, // configStorage = new LocalData.DBStorage<any>( //   dbStorageName,
  ) {
    let typeManager = this.typeManager;

    typeManager.register(new ValueDataEntryTypeDefinition());
    typeManager.register(new AccumulationDataEntryTypeDefinition());

    let categoryDict: {[name in CategoryName]: SyncCategory} = {
      app: new SyncCategory('app', typeManager),
      user: new SyncCategory('user', typeManager),
      settings: new SyncCategory('settings', typeManager),
      statistics: new SyncCategory('statistics', typeManager),
      records: new SyncCategory('records', typeManager),
      collections: new SyncCategory('collections', typeManager, true),
    };

    Object.assign(this, categoryDict);

    let categoryNames = (this.categoryNames = Object.keys(
      categoryDict,
    ) as CategoryName[]);

    for (let name of categoryNames) {
      for (let subscription of categoryDict[name].subscribe()) {
        this.subscription.add(subscription);
      }
    }

    this.syncPending$ = Observable.combineLatest(
      ...categoryNames.map(name => categoryDict[name].syncPendingItemMap$),
    ).map(maps => maps.reduce((total, map) => total + map.size, 0));

    this.subscription.add(
      Observable.interval(ms('1m')).subscribe(() =>
        this.syncBatchScheduler.schedule(undefined).catch(logger.error),
      ),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async addPassive<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
  ): Promise<void> {
    if (!category.passive) {
      throw new Error(`Category "${category.name}" is not passive`);
    }

    // TODO: doesn't seem to be safe enough (this comment is written 2 years
    // ago)
    let exists = await category.itemMap$
      .first()
      .map(map => map.has(id))
      .toPromise();

    if (exists) {
      return;
    }

    let item: SyncItem<any> = {
      id,
      data: undefined,
    };

    await Promise.all([
      category.setItem(item),
      category.addPendingUpdate({
        id,
        updateAt: Date.now(),
        data: undefined,
      }),
    ]);
  }

  async update<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
    updateData: T[K],
  ): Promise<void>;
  async update<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
    updateData: any,
    type: DataEntryType | undefined,
    bySync?: boolean,
  ): Promise<void>;
  async update<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
    updateData: T[K],
    type?: DataEntryType,
    bySync = false,
  ): Promise<void> {
    let now = Date.now();

    // If it's been syncing down from the server, type would always be
    // undefined. and it will let the default merger to replace the value by
    // the server value.

    if (bySync) {
      type = 'value';
    }

    let typeDef = this.typeManager.get(type)!;

    let item = bySync
      ? undefined
      : await category.itemMap$
          .first()
          .map(map => map.get(id))
          .toPromise();

    if (item) {
      item.data = typeDef.merge(item.data, updateData);
      await category.setItem(item);
    } else {
      item = {
        id,
        data: typeDef.merge(undefined, updateData),
      };

      // If it's been syncing down from the server, other updates might have
      // happened. So we need to check and merge these updates (that have
      // already been combined as one).
      if (bySync) {
        let pendingUpdate = await category.syncPendingItemMap$
          .first()
          .map(map => map.get(id))
          .toPromise();

        if (pendingUpdate && !pendingUpdate.removed && !category.passive) {
          let updateType = pendingUpdate.type || type;

          let typeDef = this.typeManager.get(updateType)!;

          item.data = typeDef.merge(item.data, pendingUpdate.data);
        }

        if (!pendingUpdate || !pendingUpdate.removed) {
          await category.setItem(item);
        }
      } else {
        await category.setItem(item);
      }
    }

    if (!bySync) {
      await category.addPendingUpdate({
        id,
        type,
        updateAt: now,
        data: updateData,
      });

      this.syncBatchScheduler.schedule(undefined).catch(logger.error);
    }
  }

  accumulate<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
    value: any,
    accumulationID: any = Date.now(),
  ): Promise<void> {
    return this.update(
      category,
      id,
      [
        {
          id: accumulationID,
          value,
        },
      ] as AccumulationUpdateData[],
      'accumulation',
    );
  }

  async remove<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
    bySync = false,
  ): Promise<void> {
    let now = Date.now();

    if (bySync) {
      let pendingUpdate = await category.syncPendingItemMap$
        .first()
        .map(map => map.get(id))
        .toPromise();

      if (!pendingUpdate || !pendingUpdate.removed) {
        // if pendingUpdate && pendingUpdate.removed, this item should already
        // have been removed.
        await category.removeItem(id);
      }
    } else {
      await category.removeItem(id);
    }

    if (!bySync) {
      await category.addPendingUpdate({
        id,
        updateAt: now,
        data: undefined,
        removed: true,
      });

      this.syncBatchScheduler.schedule(undefined).catch(logger.error);
    }
  }

  @memorize({ttl: 'async'})
  async sync(): Promise<boolean> {
    this.syncing$.next(true);

    try {
      return await this._sync();
    } catch (e) {
      this.toastService.show('同步失败!');
      throw e;
    } finally {
      this.syncing$.next(false);
    }
  }

  async reset(): Promise<void> {
    await Promise.all([
      this.syncConfigService.set('syncAt', undefined),
      ...this.categoryNames.map(async name => this[name].reset()),
    ]);
  }

  private async _sync(): Promise<boolean> {
    let categoryToIDToUpUpdateDictDict: Dict<Dict<UpUpdate>> = Object.create(
      null,
    );

    let syncStartTime = Date.now();

    await Promise.all(
      this.categoryNames.map(async name => {
        let category = this[name];

        let syncPendingItemMap = await category.syncPendingItemMap$
          .first()
          .toPromise();

        if (!syncPendingItemMap.size) {
          return;
        }

        let upUpdateDict = (categoryToIDToUpUpdateDictDict[
          name
        ] = Object.create(null) as Dict<UpUpdate>);

        for (let {id, ...upUpdate} of syncPendingItemMap.values()) {
          upUpdateDict[id] = upUpdate;
        }

        await category.markPendingUpdatesSynced(
          Array.from(syncPendingItemMap.keys()),
        );
      }),
    );

    let lastSyncAt = await this.syncConfigService.syncAt$.first().toPromise();

    let request: SyncRequest = {
      time: Date.now(),
      syncAt: lastSyncAt,
      updates: categoryToIDToUpUpdateDictDict,
    };

    let {
      syncAt,
      updates: categoryToIDToDownUpdateDictDict,
    } = await this.apiService.call<SyncResult>('/sync', request);

    await Promise.all(
      this.categoryNames.map(name =>
        this[name].removePendingUpdateBefore(syncStartTime),
      ),
    );

    let downUpdateCategoryNames = Object.keys(
      categoryToIDToDownUpdateDictDict,
    ) as CategoryName[];

    for (let name of downUpdateCategoryNames) {
      let category = this[name];

      let downUpdateDict = categoryToIDToDownUpdateDictDict[name];

      await Promise.all(
        Object.keys(downUpdateDict).map(async id => {
          let downUpdate = downUpdateDict[id];

          if (downUpdate.removed) {
            await this.remove(category, id, true);
          } else {
            await this.update(category, id, downUpdate.value, undefined, true);
          }
        }),
      );
    }

    await this.syncConfigService.set('syncAt', syncAt);

    this.lastSyncTime$.next(Date.now());

    let hasDownUpdate = !!downUpdateCategoryNames.length;

    let hasPending = !!await this.syncPending$.first().toPromise();

    if (hasPending) {
      return (await this._sync()) || hasDownUpdate;
    } else {
      return hasDownUpdate;
    }
  }
}

export class SyncCategory<
  T = Dict<any>,
  K extends keyof T = keyof T,
  V = T[K]
> {
  readonly itemMap$ = new ReplaySubject<Map<string, SyncItem<V>>>(1);
  readonly syncPendingItemMap$ = new BehaviorSubject(
    new Map<string, UpdateItem>(),
  );

  private pendingMergeItemIDSet: Set<string>;

  private dataStorage$: Observable<DBStorage<string, SyncItem<V>>>;
  private syncPendingStorage$: Observable<DBStorage<string, UpdateItem>>;

  private writeItemScheduler = new v.BatchScheduler<SyncItem<V | undefined>>(
    this.writeItemBatchHandler.bind(this),
  );

  private dataWriteLock = {};

  constructor(
    readonly name: string,
    readonly typeManager: DataEntryTypeManager,
    // readonly dataStorage: DBStorage<string, Item<T>>,
    // readonly syncPendingStorage: DBStorage<string, UpdateItem>,
    readonly passive = false,
    private mergeLimit = 100,
  ) {
    this.dataStorage$ = Observable.defer(async () => {
      let storage = await DBStorage.create<string, SyncItem<V>>({
        name: 'default',
        tableName: `${name}-data`,
        primaryKeyType: 'text',
      });

      let items = await storage.getAll();

      let [mergedEntry] = _.remove(items, item => !item.id);

      let itemMap = new Map<string, SyncItem<V>>(
        mergedEntry
          ? ((mergedEntry.data as any) as SyncItem<V>[]).map<
              [string, SyncItem<V>]
            >(item => [item.id, item])
          : [],
      );

      let pendingMergeSet = (this.pendingMergeItemIDSet = new Set<string>());

      for (let item of items) {
        let id = item.id;

        if (item.removed) {
          itemMap.delete(id);
        } else {
          itemMap.set(id, item);
        }

        pendingMergeSet.add(id);
      }

      this.itemMap$.next(itemMap);

      return storage;
    })
      .publishReplay(1)
      .refCount();

    this.syncPendingStorage$ = Observable.defer(async () => {
      let storage = await DBStorage.create<string, UpdateItem>({
        name: 'default',
        tableName: `${name}-sync-pending`,
        primaryKeyType: 'text',
        indexSchema: {updateAt: 'integer'},
      });

      let items = await storage.getAll();

      this.syncPendingItemMap$.next(
        new Map(items.map<[string, UpdateItem]>(item => [item.id, item])),
      );

      return storage;
    })
      .publishReplay(1)
      .refCount();
  }

  subscribe(): Subscription[] {
    return [
      this.dataStorage$.subscribe(),
      this.syncPendingStorage$.subscribe(),
    ];
  }

  async setItem(item: SyncItem<V>): Promise<void> {
    let itemMap = await this.itemMap$.first().toPromise();
    itemMap.set(item.id, item);
    this.itemMap$.next(itemMap);

    await this.writeItemScheduler.schedule(item);
  }

  async removeItem(id: K | SyncItem<V>): Promise<void> {
    if (typeof id === 'object') {
      id = id.id as K;
    }

    let itemMap = await this.itemMap$.first().toPromise();

    itemMap.delete(id);
    this.itemMap$.next(itemMap);

    await this.writeItemScheduler.schedule({
      id,
      data: undefined,
      removed: true,
    });

    // TODO: make sure we can actually schedule it with writeItemScheduler as
    // it wasn't handled together with setItem before.

    // return this._writeLock.lock(() => {
    //   // set as undefined so it could be filtered out and overwrite merged data when initializing.
    //   return this.dataStorage.set({
    //     i: id,
    //     d: undefined,
    //   });
    // });
  }

  async addPendingUpdate(updateItem: UpdateItem): Promise<void> {
    // TODO: should we use those variables directly instead of using their
    // observable version?

    let syncPendingItemMap = await this.syncPendingItemMap$.first().toPromise();

    let id = updateItem.id;

    let prevItem = syncPendingItemMap.get(id);

    if (prevItem && !prevItem.removed && !updateItem.removed) {
      let typeDef = this.typeManager.get(updateItem.type || prevItem.type)!;

      updateItem.data = typeDef.combine(prevItem.data, updateItem.data);
    }

    syncPendingItemMap.set(id, updateItem);

    this.syncPendingItemMap$.next(syncPendingItemMap);

    let storage = await this.syncPendingStorage$.toPromise();
    await storage.set(updateItem);
  }

  async markPendingUpdatesSynced(ids: string[]): Promise<void> {
    let syncPendingItemMap = await this.syncPendingItemMap$.first().toPromise();

    let markedUpdateItems = ids
      .map(id => {
        let updateItem = syncPendingItemMap.get(id)!;

        let typeDef = this.typeManager.get(updateItem.type)!;

        return typeDef.markSynced(updateItem.data) ? updateItem : undefined;
      })
      .filter(updateItem => !!updateItem) as UpdateItem[];

    if (markedUpdateItems.length) {
      let storage = await this.syncPendingStorage$.toPromise();
      await storage.setMultiple(markedUpdateItems);
    }
  }

  async removePendingUpdateBefore(time: TimeNumber): Promise<void> {
    let syncPendingItemMap = await this.syncPendingItemMap$.first().toPromise();

    for (let [id, item] of syncPendingItemMap) {
      if (item.updateAt < time) {
        syncPendingItemMap.delete(id);
      }
    }

    this.syncPendingItemMap$.next(syncPendingItemMap);

    let storage = await this.syncPendingStorage$.toPromise();
    await storage.removeWhere('updateAt < ?', time);
  }

  /** For data resetting only, does not change data cached in memory.  */
  async reset(): Promise<void> {
    await Observable.merge(this.dataStorage$, this.syncPendingStorage$)
      .mergeMap(async storage => storage.empty())
      .toPromise();
  }

  private async writeItemBatchHandler(items: SyncItem<V>[]): Promise<void> {
    items = _.uniqBy(items.reverse(), 'id').reverse();

    let pendingMergeSet = this.pendingMergeItemIDSet;

    if (
      items.length < Math.floor(this.mergeLimit / 10) ||
      pendingMergeSet.size < this.mergeLimit
    ) {
      // Not that much new set operation, save them separately first.
      await v.lock(this.dataWriteLock, async () => {
        // do not want other write operation during merging,
        // or merging during other write operation.
        let storage = await this.dataStorage$.toPromise();
        await storage.setMultiple(items);
      });
    }

    if (pendingMergeSet.size >= this.mergeLimit) {
      // Skip normal set, and merge directly
      pendingMergeSet.clear();
      await this.mergeItemsData();
    }
  }

  private async mergeItemsData(): Promise<void> {
    await v.lock(this.dataWriteLock, async () => {
      // TODO: transaction?

      let storage = await this.dataStorage$.toPromise();
      let itemMap = await this.itemMap$.first().toPromise();

      await storage.set({
        id: '',
        data: Array.from(itemMap.values()) as any,
      });

      await storage.removeWhere("id != ''");
    });
  }
}
