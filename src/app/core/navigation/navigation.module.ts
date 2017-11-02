import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {NavigationService} from './navigation.service';

@NgModule({
  imports: [CommonModule],
})
export class CoreNavigationModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreNavigationModule,
      providers: [NavigationService],
    };
  }
}
