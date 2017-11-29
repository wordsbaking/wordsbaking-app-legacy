import {Injectable} from '@angular/core';

import {ServerDataGroup} from './server-data-group';
import {SyncService} from './sync.service';

import {CollectionInfo} from 'app/core/engine';

export interface AppData {
  collectionList: CollectionInfo[];
}

@Injectable()
export class AppDataService extends ServerDataGroup<AppData> {
  collectionList$ = this.getObservable('collectionList');

  constructor(syncService: SyncService) {
    super(syncService, syncService.app);
  }

  protected transformRaw({
    collectionList = [{id: 'CET-4', name: '大学英语四级'}],
  }: Partial<AppData>): AppData {
    return {collectionList};
  }
}
