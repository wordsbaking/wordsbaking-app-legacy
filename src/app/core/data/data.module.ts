import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {SyncService} from './sync.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreDataModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreDataModule,
      providers: [SyncService],
    };
  }
}
