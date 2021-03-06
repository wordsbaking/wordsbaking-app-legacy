import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {AppDataService} from './app-data.service';
import {SyncService} from './sync.service';
import {WordDataService} from './word-data.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreDataModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreDataModule,
      providers: [SyncService, AppDataService, WordDataService],
    };
  }
}
