import {Component} from '@angular/core';

@Component({
  selector: 'wb-page-header-extension',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; }'],
  animations: [],
})
export class PageHeaderExtensionComponent {}
