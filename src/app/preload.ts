import * as _ from 'lodash';
import * as v from 'villa';

import {SyncCategoryName, SyncItem, SyncUpdateItem} from 'app/core/data';
import {DBStorage} from 'app/core/storage';

const SYNC_CATEGORY_NAMES: SyncCategoryName[] = [
  'app',
  'user',
  'settings',
  'statistics',
  'records',
  'collections',
];

export const syncStorageDict: Dict<DBStorage<any, SyncItem<any>>> = {};
export const syncPendingStorageDict: Dict<DBStorage<any, SyncUpdateItem>> = {};

export const syncItemMapDict: Dict<Map<string, SyncItem<any>>> = {};
export const syncPendingItemMapDict: Dict<Map<string, SyncUpdateItem>> = {};

async function prepareSyncStorage(name: string): Promise<void> {
  let storage = await DBStorage.create<string, SyncItem<any>>({
    name: 'default',
    tableName: `${name}-data`,
    primaryKeyType: 'text',
  });

  let items = await storage.getAll();

  let [mergedEntry] = _.remove(items, item => !item.id);

  let itemMap = new Map<string, SyncItem<any>>(
    mergedEntry
      ? (mergedEntry.data as SyncItem<any>[]).map<
          [string, SyncItem<any>]
        >(item => [item.id, item])
      : [],
  );

  for (let item of items) {
    let id = item.id;

    if (item.removed) {
      itemMap.delete(id);
    } else {
      itemMap.set(id, item);
    }
  }

  syncStorageDict[name] = storage;
  syncItemMapDict[name] = itemMap;
}

async function prepareSyncPendingStorage(name: string): Promise<void> {
  let storage = await DBStorage.create<string, SyncUpdateItem>({
    name: 'default',
    tableName: `${name}-sync-pending`,
    primaryKeyType: 'text',
    indexSchema: {updateAt: 'integer', updateID: 'integer'},
  });

  let items = await storage.getAll();

  syncPendingStorageDict[name] = storage;
  syncPendingItemMapDict[name] = new Map(
    items.map<[string, SyncUpdateItem]>(item => [item.id, item]),
  );
}

export const configStorageDict: Dict<DBStorage<string, any>> = {};
export const initialRawConfigDict: Dict<object> = {};

const CONFIG_NAMES = ['auth', 'sync'];

async function prepareConfigStorage(name: string): Promise<void> {
  let storage = await DBStorage.create<string, any>({
    name: 'default',
    tableName: name,
    primaryKeyType: 'text',
  });

  configStorageDict[name] = storage;
  initialRawConfigDict[name] = await storage.getAllAsDict();
}

export async function _preload() {
  await Promise.all([
    v.parallel(SYNC_CATEGORY_NAMES, name => prepareSyncStorage(name)),
    v.parallel(SYNC_CATEGORY_NAMES, name => prepareSyncPendingStorage(name)),
    v.parallel(CONFIG_NAMES, name => prepareConfigStorage(name)),
  ]);
}
