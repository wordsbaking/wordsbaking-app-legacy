import {Component, OnDestroy} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {LoadingService} from 'app/ui';

import {SettingsConfigService} from 'app/core/config';
import {AppDataService, SyncService} from 'app/core/data';
import {CollectionInfo} from 'app/core/engine';
import {SelectionListPopup, SelectionListPopupService} from 'app/core/ui';

@Component({
  selector: 'wb-glance-view-collection-selector',
  templateUrl: './collection-selector.component.html',
  styleUrls: ['./collection-selector.component.less'],
})
export class CollectionSelectorComponent implements OnDestroy {
  private selectedID$ = this.settingsConfigService.collectionIDSet$
    .map(idSet => Array.from(idSet)[0] as string | undefined)
    .publishReplay(1)
    .refCount();

  private collectionList$ = this.appDataService.collectionList$;

  selected$ = Observable.combineLatest(
    this.selectedID$,
    this.collectionList$,
  ).map(([id, collectionList]) => {
    if (!id) {
      return undefined;
    }

    return collectionList.find(collection => collection.id === id);
  });

  private subscription = new Subscription();

  constructor(
    private selectionListPopupService: SelectionListPopupService,
    private appDataService: AppDataService,
    private settingsConfigService: SettingsConfigService,
    private syncService: SyncService,
    private loadingService: LoadingService,
  ) {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async showPopup(): Promise<void> {
    let selectedID = await this.selectedID$.first().toPromise();

    let collectionList = await this.collectionList$.first().toPromise();

    let values = await this.selectionListPopupService.show(
      collectionList.map<SelectionListPopup.ListItem<CollectionInfo>>(item => ({
        text: item.name,
        value: item,
        selected: selectedID === item.id,
      })),
    );

    await this.onSelectionListChange(values);
  }

  async onSelectionListChange(
    values: CollectionInfo[] | undefined,
  ): Promise<void> {
    let selectedCollection = values && values[0];

    if (!selectedCollection) {
      return;
    }

    await this.settingsConfigService.set('collectionIDs', [
      selectedCollection.id,
    ]);

    await this.loadingService.wait(this.syncService.sync(), '正在同步...');
  }
}
