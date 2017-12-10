import {ModuleWithProviders} from '@angular/core';

export class PlatformAppModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PlatformAppModule,
      providers: [],
    };
  }
}
