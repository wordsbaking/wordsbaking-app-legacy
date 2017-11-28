// tslint:disable:no-null-keyword

import {Injectable, NgZone, OnDestroy} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

import * as _ from 'lodash';
import memorize from 'memorize-decorator';
import * as v from 'villa';

import {APIService} from 'app/core/common';
import {
  SettingsRawConfig,
  SyncConfigService,
  UserConfig,
} from 'app/core/config';
import {StudyRecordData} from 'app/core/engine';
import {DBStorage} from 'app/core/storage';

import {Subscription} from 'rxjs/Subscription';
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

export type CategoryHost = {[key in CategoryName]: Category};

@Injectable()
export class SyncService implements CategoryHost, OnDestroy {
  /**
   * This is different from `syncAt`, while `syncAt` is time of server, it is
   * of client.
   */
  readonly lastSyncTime$ = new BehaviorSubject(0 as TimeNumber);
  readonly syncing$ = new BehaviorSubject(false);

  readonly app: Category;
  readonly user: Category<UserConfig>;
  readonly settings: Category<SettingsRawConfig>;
  readonly statistics: Category;
  readonly records: Category<Dict<StudyRecordData>>;
  readonly collections: Category<Dict<CollectionData>>;

  readonly categoryNames: CategoryName[];

  readonly syncPending$: Observable<number>;

  private typeManager = new DataEntryTypeManager();

  private subscription = new Subscription();

  constructor(
    readonly apiService: APIService,
    readonly syncConfigService: SyncConfigService, // readonly url: string, // readonly auth?: AuthData, // readonly dbStorageName = DEFAULT_DATA_TYPE, // configStorage = new LocalData.DBStorage<any>( //   dbStorageName,
    zone: NgZone,
  ) {
    let typeManager = this.typeManager;

    typeManager.register(new ValueDataEntryTypeDefinition());
    typeManager.register(new AccumulationDataEntryTypeDefinition());

    let categoryDict: {[name in CategoryName]: Category} = {
      app: new Category('app', typeManager, zone),
      user: new Category('user', typeManager, zone),
      settings: new Category('settings', typeManager, zone),
      statistics: new Category('statistics', typeManager, zone),
      records: new Category('records', typeManager, zone),
      collections: new Category('collections', typeManager, zone, true),
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
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async addPassive<T, K extends keyof T>(
    category: Category<T>,
    id: K,
  ): Promise<void> {
    if (!category.passive) {
      throw new Error(`Category "${category.name}" is not passive`);
    }

    // TODO: doesn't seem to be safe enough (2 years ago)
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
    category: Category<T>,
    id: K,
    updateData: T[K],
  ): Promise<void>;
  async update<T, K extends keyof T>(
    category: Category<T>,
    id: K,
    updateData: any,
    type: DataEntryType | undefined,
    bySync?: boolean,
  ): Promise<void>;
  async update<T, K extends keyof T>(
    category: Category<T>,
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
    }
  }

  accumulate<T, K extends keyof T>(
    category: Category<T>,
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
    category: Category<T>,
    id: K,
    bySync = false,
  ): Promise<void> {
    let now = Date.now();

    if (bySync) {
      let pendingUpdate = category.syncPendingItemMap$
        .first()
        .map(map => map.get(id))
        .toPromise();

      if (!pendingUpdate) {
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
    }
  }

  @memorize({ttl: 'async'})
  async sync(): Promise<boolean> {
    let categoryToIDToUpUpdateDictDict: Dict<Dict<UpUpdate>> = Object.create(
      null,
    );

    this.syncing$.next(true);

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
    } = await this.apiService.call<SyncResult>('/api/sync', request);

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

    return !!downUpdateCategoryNames.length;
  }

  async reset(): Promise<void> {
    await Promise.all([
      this.syncConfigService.set('syncAt', undefined),
      ...this.categoryNames.map(async name => this[name].reset()),
    ]);
  }
}

export class Category<T = Dict<any>, K extends keyof T = keyof T, V = T[K]> {
  readonly itemMap$ = new ReplaySubject<Map<string, SyncItem<V>>>(1);
  readonly syncPendingItemMap$ = new ReplaySubject<Map<string, UpdateItem>>(1);

  private pendingMergeItemIDSet: Set<string>;

  private itemMap: Map<string, SyncItem<V>>;
  private syncPendingItemMap: Map<string, UpdateItem>;

  private dataStorage$: Observable<DBStorage<string, SyncItem<V>>>;
  private syncPendingStorage$: Observable<DBStorage<string, UpdateItem>>;

  private writeItemScheduler = new v.BatchScheduler<SyncItem<V | undefined>>(
    this.writeItemBatchHandler.bind(this),
  );

  private dataWriteLock = {};

  constructor(
    readonly name: string,
    readonly typeManager: DataEntryTypeManager,
    zone: NgZone,
    // readonly dataStorage: DBStorage<string, Item<T>>,
    // readonly syncPendingStorage: DBStorage<string, UpdateItem>,
    readonly passive = false,
    private mergeLimit = 100,
  ) {
    this.dataStorage$ = Observable.defer(async () => {
      let storage = await DBStorage.create<string, SyncItem<V>>(
        {
          name: 'default',
          tableName: `${name}-data`,
          primaryKeyType: 'text',
        },
        zone,
      );

      let items = await storage.getAll();

      let [mergedEntry] = _.remove(items, item => !item.id);

      let itemMap = (this.itemMap = new Map<string, SyncItem<V>>(
        mergedEntry
          ? ((mergedEntry.data as any) as SyncItem<V>[]).map<
              [string, SyncItem<V>]
            >(item => [item.id, item])
          : [],
      ));

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
      let storage = await DBStorage.create<string, UpdateItem>(
        {
          name: 'default',
          tableName: `${name}-sync-pending`,
          primaryKeyType: 'text',
          indexSchema: {updateAt: 'integer'},
        },
        zone,
      );

      let items = await storage.getAll();

      this.syncPendingItemMap = new Map(
        items.map<[string, UpdateItem]>(item => [item.id, item]),
      );

      this.syncPendingItemMap$.next(this.syncPendingItemMap);

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
    this.itemMap.set(item.id, item);
    this.itemMap$.next(this.itemMap);

    await this.writeItemScheduler.schedule(item);
  }

  async removeItem(id: K | SyncItem<V>): Promise<void> {
    if (typeof id === 'object') {
      id = id.id as K;
    }

    this.itemMap.delete(id);
    this.itemMap$.next(this.itemMap);

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

    let syncPendingItemMap = this.syncPendingItemMap;

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
    let markedUpdateItems = ids
      .map(id => {
        let updateItem = this.syncPendingItemMap.get(id)!;

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
    for (let [id, item] of this.syncPendingItemMap) {
      if (item.updateAt < time) {
        this.syncPendingItemMap.delete(id);
      }
    }

    this.syncPendingItemMap$.next(this.syncPendingItemMap);

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

      await storage.set({
        id: '',
        data: Array.from(this.itemMap.values()) as any,
      });

      await storage.removeWhere("id != ''");
    });
  }
}
