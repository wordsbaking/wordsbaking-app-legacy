import {CommonModule} from '@angular/common';
import {ModuleWithProviders, NgModule} from '@angular/core';

import {UserService} from './user.service';

@NgModule({
  imports: [CommonModule],
  declarations: [],
})
export class CoreUserModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreUserModule,
      providers: [UserService],
    };
  }
}
