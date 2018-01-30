// tslint:disable:no-null-keyword

import {Injectable, OnDestroy} from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import * as _ from 'lodash';
import memorize from 'memorize-decorator';
import * as moment from 'moment';
import * as ms from 'ms';
import * as v from 'villa';

import {
  syncItemMapDict,
  syncPendingItemMapDict,
  syncPendingStorageDict,
  syncStorageDict,
} from 'app/preload';

import {APIService} from 'app/core/common';
import {SettingsRawConfig, UserConfig} from 'app/core/config';
import {SyncConfigService} from 'app/core/config/sync';
import {StudyRecordData} from 'app/core/engine';

import * as logger from 'logger';

import {AppData} from './app-data.service';
import {
  AccumulationDataEntryTypeDefinition,
  AccumulationUpdateData,
  CollectionData,
  DataEntryType,
  DataEntryTypeManager,
  SyncItem,
  SyncUpdateItem,
  ValueDataEntryTypeDefinition,
} from './types';

const SYNC_BATCH_TIMEOUT = ms('10s');
const AUTO_SYNC_INTERVAL = ms('1m');

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

export type SyncCategoryName =
  | 'app'
  | 'user'
  | 'settings'
  | 'statistics'
  | 'records'
  | 'collections';

export type CategoryHost = {[key in SyncCategoryName]: SyncCategory};

@Injectable()
export class SyncService implements CategoryHost, OnDestroy {
  /**
   * This is different from `syncAt`, while `syncAt` is time of server, it is
   * of client.
   */
  readonly lastSyncTime$ = new BehaviorSubject(0 as TimeNumber);
  readonly lastSyncError$ = new BehaviorSubject<Error | undefined>(undefined);
  readonly syncing$ = new BehaviorSubject(false);

  readonly app: SyncCategory<AppData>;
  readonly user: SyncCategory<UserConfig>;
  readonly settings: SyncCategory<SettingsRawConfig>;
  readonly statistics: SyncCategory;
  readonly records: SyncCategory<Dict<StudyRecordData>>;
  readonly collections: SyncCategory<Dict<CollectionData>>;

  readonly categoryNames: SyncCategoryName[];

  readonly syncPending$: Observable<number>;

  disabled = false;

  private syncAt: TimeNumber;
  private lastUpdateID = this.createUpdateID();

  private typeManager = new DataEntryTypeManager();

  private syncBatchScheduleFlush$ = new Subject<void>();
  private syncBatchSchedule$ = new Subject<void>();

  private subscription = new Subscription();

  constructor(
    readonly apiService: APIService,
    readonly syncConfigService: SyncConfigService, // readonly url: string, // readonly auth?: AuthData, // readonly dbStorageName = DEFAULT_DATA_TYPE, // configStorage = new LocalData.DBStorage<any>( //   dbStorageName,
  ) {
    let typeManager = this.typeManager;

    typeManager.register(new ValueDataEntryTypeDefinition());
    typeManager.register(new AccumulationDataEntryTypeDefinition());

    let categoryDict: {[name in SyncCategoryName]: SyncCategory} = {
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
    ) as SyncCategoryName[]);

    this.syncPending$ = Observable.combineLatest(
      ...categoryNames.map(name => categoryDict[name].syncPendingItemMap$),
    )
      .map(maps => maps.reduce((total, map) => total + map.size, 0))
      .shareReplay(1);

    syncConfigService.syncAt$
      .first()
      .subscribe(syncAt => (this.syncAt = syncAt));

    this.subscription.add(
      this.syncBatchSchedule$
        .merge(Observable.interval(AUTO_SYNC_INTERVAL))
        .audit(() =>
          Observable.race<any>(
            Observable.interval(SYNC_BATCH_TIMEOUT),
            this.syncBatchScheduleFlush$.first(),
          ),
        )
        .subscribe(() => {
          this.aggregateSync().catch(logger.error);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async addPassive<T, K extends keyof T>(
    category: SyncCategory<T>,
    id: K,
  ): Promise<boolean> {
    if (!category.passive) {
      throw new Error(`Category "${category.name}" is not passive`);
    }

    // TODO: doesn't seem to be safe enough (this comment is written 2 years
    // ago)
    let exists =
      category.itemMap$.value.has(id) ||
      category.syncPendingItemMap$.value.has(id);

    if (exists) {
      return false;
    }

    // let item: SyncItem<any> = {
    //   id,
    //   data: undefined,
    // };

    // await Promise.all([
    //   category.setItem(item),
    //   category.addPendingUpdate({
    //     id,
    //     updateAt: Date.now(),
    //     updateID: await this.getNextUpdateID(),
    //     data: undefined,
    //   }),
    // ]);

    await category.addPendingUpdate({
      id,
      data: undefined,
      updateAt: Date.now(),
      updateID: this.createUpdateID(),
    });

    return true;
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
    // If it's been syncing down from the server, type would always be
    // undefined. and it will let the default merger to replace the value by
    // the server value.

    if (bySync) {
      type = 'value';
    }

    if (!bySync) {
      await category.addPendingUpdate({
        id,
        type,
        data: updateData,
        updateAt: Date.now(),
        updateID: this.createUpdateID(),
      });

      this.syncBatchSchedule$.next();
    }

    let typeDef = this.typeManager.get(type)!;

    let item = bySync ? undefined : category.itemMap$.value.get(id);

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
        let pendingUpdate = category.syncPendingItemMap$.value.get(id);

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
    if (!bySync) {
      await category.addPendingUpdate({
        id,
        data: undefined,
        removed: true,
        updateAt: Date.now(),
        updateID: this.createUpdateID(),
      });

      this.syncBatchSchedule$.next();
    }

    if (bySync) {
      let pendingUpdate = category.syncPendingItemMap$.value.get(id);

      if (!pendingUpdate || !pendingUpdate.removed) {
        // if pendingUpdate && pendingUpdate.removed, this item should already
        // have been removed.
        await category.removeItem(id);
      }
    } else {
      await category.removeItem(id);
    }
  }

  async reset(): Promise<void> {
    await Promise.all([
      this.syncConfigService.reset(),
      ...this.categoryNames.map(async name => this[name].reset()),
    ]);
  }

  async sync(): Promise<boolean> {
    this.syncBatchScheduleFlush$.next();

    return this.aggregateSync();
  }

  private createUpdateID(): number {
    let lastUpdateID = Number(localStorage.lastUpdateID) || 0;

    let updateID = Math.max(lastUpdateID + 1, Date.now());

    localStorage.lastUpdateID = (this.lastUpdateID = updateID).toString();

    return updateID;
  }

  @memorize({ttl: 'async'})
  private async aggregateSync(): Promise<boolean> {
    this.syncing$.next(true);

    try {
      return await this._sync();
    } catch (e) {
      this.lastSyncError$.next(e);
      throw e;
    } finally {
      this.syncing$.next(false);
    }
  }

  private async _sync(): Promise<boolean> {
    if (this.disabled) {
      return false;
    }

    let categoryToIDToUpUpdateDictDict: Dict<Dict<UpUpdate>> = Object.create(
      null,
    );

    let lastUpdateID = this.lastUpdateID;

    await Promise.all(
      this.categoryNames.map(async name => {
        let category = this[name];

        let syncPendingItemMap = await category.syncPendingItemMap$.value;

        if (!syncPendingItemMap.size) {
          return;
        }

        let upUpdateDict = (categoryToIDToUpUpdateDictDict[
          name
        ] = Object.create(null) as Dict<UpUpdate>);

        for (let {id, updateID, ...upUpdate} of syncPendingItemMap.values()) {
          upUpdateDict[id] = upUpdate;
        }

        await category.markPendingUpdatesSynced(
          Array.from(syncPendingItemMap.keys()),
        );
      }),
    );

    let request: SyncRequest = {
      time: Date.now(),
      syncAt: this.syncAt,
      updates: categoryToIDToUpUpdateDictDict,
    };

    let {
      syncAt,
      updates: categoryToIDToDownUpdateDictDict,
    } = await this.apiService.call<SyncResult>('/sync', request);

    if (this.disabled) {
      return false;
    }

    await Promise.all(
      this.categoryNames.map(name =>
        this[name].removePendingUpdateBefore(lastUpdateID),
      ),
    );

    let downUpdateCategoryNames = Object.keys(
      categoryToIDToDownUpdateDictDict,
    ) as SyncCategoryName[];

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

    this.syncAt = syncAt;
    await this.syncConfigService.set('syncAt', syncAt);

    this.lastSyncTime$.next(Date.now());

    let hasDownUpdate = !!downUpdateCategoryNames.length;

    let syncPending = 0;

    this.syncPending$.first().subscribe(value => (syncPending = value));

    if (syncPending) {
      // Manually pass `syncAt` as syncPending$
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
  private syncStorage = syncStorageDict[this.name];

  readonly itemMap$ = new BehaviorSubject<Map<string, SyncItem<V>>>(
    syncItemMapDict[this.name],
  );

  private syncPendingStorage = syncPendingStorageDict[this.name];

  readonly syncPendingItemMap$ = new BehaviorSubject(
    syncPendingItemMapDict[this.name],
  );

  private writeItemScheduler = new v.BatchScheduler<SyncItem<V | undefined>>(
    this.writeItemBatchHandler.bind(this),
  );

  private syncWriteLock = {};

  constructor(
    readonly name: string,
    readonly typeManager: DataEntryTypeManager,
    // readonly dataStorage: DBStorage<string, Item<T>>,
    // readonly syncPendingStorage: DBStorage<string, UpdateItem>,
    readonly passive = false,
    private mergeLimit = 100,
  ) {}

  async setItem(item: SyncItem<V>): Promise<void> {
    let itemMap = this.itemMap$.value;

    itemMap.set(item.id, item);
    this.itemMap$.next(itemMap);

    await this.writeItemScheduler.schedule(item);
  }

  async removeItem(id: K | SyncItem<V>): Promise<void> {
    if (typeof id === 'object') {
      id = id.id as K;
    }

    let itemMap = this.itemMap$.value;

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

  async addPendingUpdate(updateItem: SyncUpdateItem): Promise<void> {
    let pendingItemMap = this.syncPendingItemMap$.value;

    let id = updateItem.id;

    let prevItem = pendingItemMap.get(id);

    if (prevItem && !prevItem.removed && !updateItem.removed) {
      let typeDef = this.typeManager.get(updateItem.type || prevItem.type)!;

      updateItem.data = typeDef.combine(prevItem.data, updateItem.data);
    }

    pendingItemMap.set(id, updateItem);

    this.syncPendingItemMap$.next(pendingItemMap);

    await this.syncPendingStorage.set(updateItem);
  }

  async markPendingUpdatesSynced(ids: string[]): Promise<void> {
    let syncPendingItemMap = this.syncPendingItemMap$.value;

    let markedUpdateItems = ids
      .map(id => {
        let updateItem = syncPendingItemMap.get(id)!;

        let typeDef = this.typeManager.get(updateItem.type)!;

        return typeDef.markSynced(updateItem.data) ? updateItem : undefined;
      })
      .filter(updateItem => !!updateItem) as SyncUpdateItem[];

    if (markedUpdateItems.length) {
      await this.syncPendingStorage.setMultiple(markedUpdateItems);
    }
  }

  async removePendingUpdateBefore(lastUpdateID: number): Promise<void> {
    let syncPendingItemMap = this.syncPendingItemMap$.value;

    for (let [id, item] of syncPendingItemMap) {
      if (item.updateID <= lastUpdateID) {
        syncPendingItemMap.delete(id);
      }
    }

    this.syncPendingItemMap$.next(syncPendingItemMap);

    await this.syncPendingStorage.removeWhere('updateID <= ?', lastUpdateID);
  }

  /** For data resetting only, does not change data cached in memory.  */
  async reset(): Promise<void> {
    await Promise.all([
      this.syncStorage.empty(),
      this.syncPendingStorage.empty(),
    ]);
  }

  private async writeItemBatchHandler(items: SyncItem<V>[]): Promise<void> {
    items = _.uniqBy(items.reverse(), 'id').reverse();

    let mergePending = (await this.syncStorage.getPrimaryKeys()).length;

    if (
      items.length < Math.floor(this.mergeLimit / 10) ||
      mergePending < this.mergeLimit
    ) {
      // Not that much new set operation, save them separately first.
      await v.lock(this.syncWriteLock, async () => {
        // do not want other write operation during merging,
        // or merging during other write operation.
        await this.syncStorage.setMultiple(items);
      });
    }

    if (mergePending >= this.mergeLimit) {
      // Skip normal set, and merge directly
      await this.mergeItemsData();
    }
  }

  private async mergeItemsData(): Promise<void> {
    await v.lock(this.syncWriteLock, async () => {
      // TODO: transaction?
      await this.syncStorage.set({
        id: '',
        data: Array.from(this.itemMap$.value.values()) as any,
      });

      await this.syncStorage.removeWhere("id != ''");
    });
  }
}
