import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {NavigationService} from './navigation.service';
import {TriggerBackDirective} from './trigger-back.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [TriggerBackDirective],
  exports: [TriggerBackDirective],
})
export class CoreNavigationModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreNavigationModule,
      providers: [NavigationService],
    };
  }
}
