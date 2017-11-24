import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {EngineService} from 'app/core/engine/engine.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreEngineModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreEngineModule,
      providers: [EngineService],
    };
  }
}
